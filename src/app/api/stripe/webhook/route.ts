import type Stripe from "stripe";
import { getStripe, syncPlanFromStripe } from "@/lib/stripe/server";

// Webhook Stripe. Le proxy ne passe pas par ici (pas de session) : la seule
// preuve que l'appel vient de Stripe est la signature, vérifiée sur le corps brut.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Signature manquante.", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Signature invalide.", { status: 400 });
  }

  const customerId = customerOf(event);
  if (customerId) {
    try {
      await syncPlanFromStripe(customerId);
    } catch (error) {
      console.error("[stripe webhook]", event.type, error);
      // 500 : Stripe renverra l'événement plus tard.
      return new Response("Erreur de synchronisation.", { status: 500 });
    }
  }
  return new Response("OK");
}

// Événements qui peuvent changer le plan. Les autres sont acceptés sans rien faire.
function customerOf(event: Stripe.Event): string | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const c = event.data.object.customer;
      return typeof c === "string" ? c : (c?.id ?? null);
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const c = event.data.object.customer;
      return typeof c === "string" ? c : c.id;
    }
    default:
      return null;
  }
}
