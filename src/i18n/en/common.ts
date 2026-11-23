// Textes partagés : barre de démo, en-têtes, pied de page, statuts, 404.
export const common = {
  bar: {
    label: "About this demo",
    tagline: "Portfolio demo · sample data",
    readCode: "Read the code",
    newTab: "(opens in a new tab)",
    language: "Language",
    switchTo: { en: "English", fr: "Français" },
  },
  meta: {
    description: "Invoicing and payment tracking for freelancers.",
  },
  footer: {
    terms: "Terms of Service",
    privacy: "Privacy Policy",
  },
  nav: {
    label: "Main navigation",
    dashboard: "Dashboard",
    invoices: "Invoices",
    clients: "Clients",
    settings: "Settings",
    admin: "Admin",
    logout: "Log out",
  },
  demoBanner: {
    title: "Demo workspace.",
    body: "Sample data only: no email is sent, payments use Stripe test mode, and everything is deleted after 24 hours.",
  },
  status: {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue",
  },
  loading: "Loading…",
  pending: "One moment…",
  save: "Save",
  cancel: "Cancel",
  notFound: {
    title: "Page not found",
    eyebrow: "Error 404",
    heading: "This page isn't in the notebook.",
    body: "The address may be mistyped, or the page no longer exists. Your invoices and clients are right where you left them.",
    back: "Back to dashboard",
  },
};
