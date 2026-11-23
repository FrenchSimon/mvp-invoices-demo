import type { Dictionary } from "../dictionaries";

export const pro: Dictionary["pro"] = {
  title: "Formule Pro",
  yourPro: "Votre formule Pro",
  upgrade: "Passer à Pro",
  proIntro: "Factures illimitées et votre logo sur vos PDF.",
  freeIntro: "Ce mois-ci : {used} sur {limit}\u00a0factures utilisées avec la formule Gratuit.",
  justPaid: "Paiement reçu : vous êtes passé à Pro. Merci !",
  confirming: "Votre paiement est en cours de confirmation. Rechargez la page dans un instant.",
  feature: "Fonctionnalité",
  free: "Gratuit",
  proName: "Pro",
  yours: " (la vôtre)",
  rows: {
    invoices: "Factures par mois",
    sending: "Envoi en PDF et par e-mail",
    logo: "Votre logo sur le PDF",
    price: "Prix",
  },
  values: {
    unlimited: "Illimitées",
    yes: "Oui",
    no: "Non",
    free: "Gratuit",
    proPrice: "9 € par mois",
  },
  manage: "Gérer mon abonnement",
  manageNote:
    "Changer de carte, consulter vos reçus ou résilier : tout se passe sur la page sécurisée de Stripe.",
  checkoutNote:
    "Paiement par carte sur la page sécurisée de Stripe. Sans engagement : résiliable à tout moment.",
  demoBefore: "Démo : Stripe est en mode test, aucun paiement réel n'est prélevé. Utilisez la carte",
  demoAfter: ", n'importe quelle date future et n'importe quel code à 3 chiffres.",
  errors: {
    checkout: "Le paiement n'a pas pu démarrer. Réessayez dans un instant.",
    noSubscription: "Aucun abonnement à gérer.",
    portal: "La gestion de l'abonnement n'est pas disponible pour le moment. Réessayez plus tard.",
  },
};
