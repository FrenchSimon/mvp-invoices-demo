// Clients : liste, fiche, formulaire.
export const clients = {
  title: "Clients",
  client: "Client",
  newClient: "New client",
  loadError: "Clients couldn't be loaded.",
  empty: "No clients yet. Add your first client to start invoicing.",
  colName: "Name",
  colEmail: "Email",
  colAddress: "Address",
  form: {
    name: "Name or company name",
    email: "Email",
    emailHint: "The address invoices are sent to.",
    address: "Address",
    vat: "VAT number (optional)",
    add: "Add client",
  },
  delete: {
    confirm: "Delete this client? This cannot be undone.",
    button: "Delete this client",
    deleting: "Deleting…",
  },
  errors: {
    name: "Enter the client's name.",
    email: "Invalid email address.",
    save: "The client couldn't be saved. Try again.",
    gone: "This client no longer exists.",
    hasInvoices: "This client has invoices, so it can't be deleted.",
    delete: "The client couldn't be deleted. Try again.",
  },
};
