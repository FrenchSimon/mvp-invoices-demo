import type { Dictionary } from "../dictionaries";

export const clients: Dictionary["clients"] = {
  title: "Clients",
  client: "Client",
  newClient: "Nouveau client",
  loadError: "Les clients n'ont pas pu être chargés.",
  empty: "Aucun client pour l'instant. Ajoutez votre premier client pour commencer à facturer.",
  colName: "Nom",
  colEmail: "E-mail",
  colAddress: "Adresse",
  form: {
    name: "Nom ou raison sociale",
    email: "E-mail",
    emailHint: "L'adresse à laquelle les factures sont envoyées.",
    address: "Adresse",
    vat: "N° de TVA intracommunautaire (facultatif)",
    add: "Ajouter le client",
  },
  delete: {
    confirm: "Supprimer ce client ? Cette action est définitive.",
    button: "Supprimer ce client",
    deleting: "Suppression…",
  },
  errors: {
    name: "Indiquez le nom du client.",
    email: "Adresse e-mail invalide.",
    save: "Le client n'a pas pu être enregistré. Réessayez.",
    gone: "Ce client n'existe plus.",
    hasInvoices: "Ce client a des factures : il ne peut pas être supprimé.",
    delete: "Le client n'a pas pu être supprimé. Réessayez.",
  },
};
