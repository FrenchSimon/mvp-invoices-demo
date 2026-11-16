import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";

// Arrivée depuis un lien reçu par email (confirmation d'inscription, mot de passe oublié).
// Deux formats possibles selon le modèle d'email Supabase :
// - ?code=…              (modèle par défaut, flux PKCE : même navigateur obligatoire)
// - ?token_hash=…&type=… (modèle conseillé, marche aussi dans un autre navigateur)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (ok) return NextResponse.redirect(new URL(next, origin));

  const failed = new URL("/login", origin);
  failed.searchParams.set("error", "link");
  return NextResponse.redirect(failed);
}
