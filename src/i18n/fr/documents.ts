import type { Dictionary } from "../dictionaries";

export const documents: Dictionary["documents"] = {
  pdf: {
    title: "Facture",
    docTitle: "Facture {number}",
    number: "Numéro",
    date: "Date",
    dueDate: "Échéance",
    billTo: "Facturé à",
    vatNo: "N° TVA : {number}",
    description: "Désignation",
    qty: "Qté",
    unitPrice: "Prix unit. HT",
    amount: "Montant HT",
    subtotal: "Total HT",
    vat: "TVA",
    vatRate: "TVA {rate}",
    total: "Total TTC",
    vatExempt: "TVA non applicable, art. 293 B du CGI",
    footer:
      "Paiement dû au plus tard le {date}. Tout retard de paiement entraîne des pénalités de retard au taux de trois fois le taux d'intérêt légal, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 et D441-5 du Code de commerce). Pas d'escompte pour paiement anticipé.",
    fileName: "facture-{number}.pdf",
    loginRequired: "Connexion requise.",
    notFound: "Facture introuvable.",
  },
  email: {
    yourSupplier: "Votre prestataire",
    subject: "Facture {number} – {from}",
    hello: "Bonjour,",
    body: "Veuillez trouver ci-joint la facture {number} d'un montant de {amount}, à régler au plus tard le {date}.",
    thanks: "Bien cordialement,",
    footer: "Envoyé avec {app}.",
    notEnabled:
      "L'envoi vers cette adresse n'est pas encore activé : un domaine d'envoi doit d'abord être vérifié.",
    rateLimit: "Trop d'e-mails en même temps. Réessayez dans une minute.",
    failed: "L'e-mail n'a pas pu être envoyé. Réessayez dans un instant.",
    notConfigured: "L'envoi d'e-mails n'est pas configuré sur ce serveur.",
  },
};
