"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, PRO_PRICE_CENTS, PRO_PRODUCT_NAME } from "@/lib/stripe/server";
import { getRequestI18n } from "@/i18n/server";
import { requireUser } from "@/lib/supabase/user";

export type ProState = { error?: string };

// Adresse du site telle que le navigateur l'a appelée (local, Vercel…),
// pour que Stripe renvoie au même endroit après le paiement.
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// Client Stripe du compte connecté, créé au premier passage.
async function ensureCustomer(userId: string, email: string): Promise<string> {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();
  if (error || !profile) throw new Error("Profile not found.");
  if (profile.stripe_customer_id) return profile.stripe_customer_id;

  // Même clé d'idempotence : deux clics rapides ne créent qu'un client Stripe.
  const customer = await getStripe().customers.create(
    // Espace de démo : pas d'adresse, Stripe la demande sur sa page de paiement.
    { email: email || undefined, metadata: { user_id: userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  // La colonne n'est modifiable que par le serveur (droits de la migration init).
  const { error: saveError } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);
  if (saveError) throw new Error("Stripe customer not saved.");
  return customer.id;
}

// Point 9 : paiement du plan Pro (9 €/mois) sur la page de paiement de Stripe.
export async function startCheckout(): Promise<ProState> {
  const { supabase, user } = await requireUser();
  // Page de paiement Stripe dans la langue choisie sur le site.
  const { locale, t } = await getRequestI18n();
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan === "pro") redirect("/pro");

  let url: string | null;
  try {
    const customer = await ensureCustomer(user.id, user.email ?? "");
    const origin = await siteOrigin();
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      locale,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: PRO_PRICE_CENTS,
            recurring: { interval: "month" },
            product_data: { name: PRO_PRODUCT_NAME },
          },
        },
      ],
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${origin}/pro?payment=success`,
      cancel_url: `${origin}/pro`,
    });
    url = session.url;
  } catch (error) {
    console.error("[pro] checkout", error);
    return { error: t.pro.errors.checkout };
  }
  if (!url) return { error: t.pro.errors.checkout };
  redirect(url);
}

// Gérer ou résilier l'abonnement : portail client de Stripe.
export async function openBillingPortal(): Promise<ProState> {
  const { supabase, user } = await requireUser();
  const { locale, t } = await getRequestI18n();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_customer_id) return { error: t.pro.errors.noSubscription };

  let url: string;
  try {
    const origin = await siteOrigin();
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      locale,
      return_url: `${origin}/pro`,
    });
    url = session.url;
  } catch (error) {
    console.error("[pro] portal", error);
    return { error: t.pro.errors.portal };
  }
  redirect(url);
}
