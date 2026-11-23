import type { Dictionary } from "../dictionaries";

//   : espace insécable avant « : ; ? ! » et à l'intérieur des guillemets.
export const common: Dictionary["common"] = {
  bar: {
    label: "À propos de cette démo",
    tagline: "Démo de portfolio · données fictives",
    readCode: "Voir le code",
    newTab: "(s'ouvre dans un nouvel onglet)",
    language: "Langue",
    switchTo: { en: "English", fr: "Français" },
  },
  meta: {
    description: "Facturation et suivi des paiements pour les indépendants.",
  },
  footer: {
    terms: "Conditions d'utilisation",
    privacy: "Politique de confidentialité",
  },
  nav: {
    label: "Navigation principale",
    dashboard: "Accueil",
    invoices: "Factures",
    clients: "Clients",
    settings: "Réglages",
    admin: "Admin",
    logout: "Se déconnecter",
  },
  demoBanner: {
    title: "Espace de démo.",
    body: "Données fictives uniquement : aucun e-mail n'est envoyé, les paiements passent par le mode test de Stripe et tout est effacé au bout de 24 heures.",
  },
  status: {
    draft: "Brouillon",
    sent: "Envoyée",
    paid: "Payée",
    overdue: "En retard",
  },
  loading: "Chargement…",
  pending: "Un instant…",
  save: "Enregistrer",
  cancel: "Annuler",
  notFound: {
    title: "Page introuvable",
    eyebrow: "Erreur 404",
    heading: "Cette page n'est pas dans le carnet.",
    body: "L'adresse est peut-être mal saisie, ou la page n'existe plus. Vos factures et vos clients sont toujours là où vous les avez laissés.",
    back: "Retour au tableau de bord",
  },
};
