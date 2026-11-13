"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/user";

export type ClientFormState = {
  error?: string;
  values?: { name: string; email: string; address: string; vat_number: string };
};

function readClient(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    address: String(formData.get("address") ?? "").trim(),
    vat_number: String(formData.get("vat_number") ?? "").trim(),
  };
}

// Création (pas d'id) ou modification. Les règles RLS garantissent qu'on ne
// touche qu'à ses propres clients : un id d'un autre freelance ne modifie rien.
export async function saveClient(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const values = readClient(formData);
  const id = String(formData.get("id") ?? "");

  if (!values.name) return { error: "Indiquez le nom du client.", values };
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return { error: "Adresse email invalide.", values };
  }

  const { supabase } = await requireUser();

  if (id) {
    const { data, error } = await supabase.from("clients").update(values).eq("id", id).select("id");
    if (error) return { error: "Le client n'a pas pu être enregistré. Réessayez.", values };
    if (!data?.length) return { error: "Ce client n'existe plus.", values };
  } else {
    const { error } = await supabase.from("clients").insert(values);
    if (error) return { error: "Le client n'a pas pu être enregistré. Réessayez.", values };
  }

  redirect("/clients");
}

export type DeleteState = { error?: string };

export async function deleteClient(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireUser();

  const { error } = await supabase.from("clients").delete().eq("id", id);
  // 23503 : clé étrangère. Le client a des factures, qui doivent rester valables.
  if (error?.code === "23503") {
    return { error: "Ce client a des factures : il ne peut pas être supprimé." };
  }
  if (error) return { error: "Le client n'a pas pu être supprimé. Réessayez." };

  redirect("/clients");
}
