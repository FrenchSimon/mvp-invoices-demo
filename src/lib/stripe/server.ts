import Stripe from "stripe";
import { APP_NAME } from "@/components/brand";
import { createAdminClient } from "@/lib/supabase/admin";

// Prix du plan Pro (checklist, point 9). Défini dans le code plutôt que dans
// le tableau de bord Stripe : rien à créer à la main, même prix en test et en production.
export const PRO_PRICE_CENTS = 900;
export const PRO_PRODUCT_NAME = `${APP_NAME} Pro`;

let stripe: Stripe | null = null;

// Serveur uniquement : la clé secrète ne doit jamais partir vers le navigateur.
export function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante.");
  stripe = new Stripe(key, { appInfo: { name: APP_NAME } });
  return stripe;
}

// Statuts Stripe qui donnent accès à Pro. past_due : un paiement a échoué et
// Stripe réessaie, on laisse Pro le temps des relances.
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

// Recalcule le plan d'un client Stripe à partir de ses abonnements, tels que
// Stripe les connaît maintenant. Sert au webhook et au retour du paiement :
// les événements peuvent arriver en double ou dans le désordre, ce calcul donne
// toujours le même résultat.
export async function syncPlanFromStripe(customerId: string): Promise<"free" | "pro" | null> {
  const subs = await getStripe().subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  const current = subs.data.find((s) => PRO_STATUSES.has(s.status)) ?? subs.data[0];
  const plan = current && PRO_STATUSES.has(current.status) ? "pro" : "free";

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ plan, subscription_status: current?.status ?? null })
    .eq("stripe_customer_id", customerId)
    .select("id");
  if (error) throw new Error(`Mise à jour du plan impossible : ${error.message}`);
  // Aucun profil pour ce client Stripe (client créé ailleurs) : rien à faire.
  return data && data.length > 0 ? plan : null;
}
