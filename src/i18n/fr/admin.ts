import type { Dictionary } from "../dictionaries";

export const admin: Dictionary["admin"] = {
  title: "Admin",
  heading: "Utilisateurs",
  loadError: "La liste des utilisateurs n'a pas pu être chargée.",
  summary: { one: "{count} compte, {pro} en Pro.", other: "{count} comptes, {pro} en Pro." },
  colAccount: "Compte",
  colPlan: "Formule",
  colInvoices: "Factures",
  colMonth: "Ce mois-ci",
  colSignedUp: "Inscription",
  noEmail: "(sans e-mail)",
  noCompany: "Sans nom d'entreprise",
  adminRole: " · admin",
  free: "Gratuite",
  pro: "Pro",
  invoiceCount: { one: "{count} facture", other: "{count} factures" },
  thisMonth: "{count} ce mois-ci",
};
