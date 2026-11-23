import type { Dictionary } from "../dictionaries";

export const landing: Dictionary["landing"] = {
  metaDescription:
    "La facturation des indépendants : vos clients, des factures PDF envoyées par e-mail, et une vue claire de ce qui est payé, en attente ou en retard.",
  navLabel: "Accueil",
  pricing: "Tarifs",
  login: "Se connecter",
  startFree: "Commencer gratuitement",
  eyebrow: "Pour les indépendants qui travaillent à leur compte",
  heading: "Vos factures bien rangées. Vos paiements enfin suivis.",
  intro:
    "Enregistrez vos clients, créez une facture propre en une minute, envoyez-la en PDF et voyez d'un coup d'œil qui vous a payé.",
  createFirst: "Créer ma première facture",
  noCard: "Gratuit, sans carte bancaire",
  plansHeading: "Deux formules, sans surprise",
  free: {
    name: "Gratuit",
    price: "0 €",
    features: [
      "{count} factures par mois",
      "Clients illimités",
      "Envoi en PDF et par e-mail",
      "Suivi des factures payées, en attente et en retard",
    ],
  },
  pro: {
    name: "Pro",
    price: "9 €",
    per: "par mois",
    features: ["Factures illimitées", "Votre logo sur les factures", "Tout ce qu'offre la formule Gratuit"],
    cta: "Passer à Pro",
  },
  sample: {
    title: "Facture",
    meta: "N° 2026-014 · émise le {date}",
    to: "À : Atelier Roche · 12 quai Saint-Antoine, 69002 Lyon",
    lines: ["Identité visuelle", "Déclinaisons du logo"],
    total: "Total TTC",
  },
};
