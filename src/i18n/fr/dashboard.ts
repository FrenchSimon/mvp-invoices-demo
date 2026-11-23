import type { Dictionary } from "../dictionaries";

export const dashboard: Dictionary["dashboard"] = {
  title: "Tableau de bord",
  loadError: "Le tableau de bord n'a pas pu être chargé.",
  proPlan: "Formule Pro · factures illimitées",
  freePlan: "Formule Gratuit · {used} factures sur {limit} utilisées ce mois-ci",
  addDetailsBefore: "Avant votre première facture,",
  addDetailsLink: "renseignez les coordonnées de votre entreprise",
  addDetailsAfter: ".",
  newInvoice: "Nouvelle facture",
  received: "Encaissé ce mois-ci",
  pending: "En attente",
  overdue: "En retard",
  overdueCount: { one: "{count} facture", other: "{count} factures" },
  latest: "Dernières factures",
  all: "Toutes les factures",
  emptyBefore: "Aucune facture pour l'instant. Commencez par",
  emptyLink: "ajouter un client",
  emptyAfter: ".",
};
