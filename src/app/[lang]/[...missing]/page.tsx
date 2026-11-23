import { notFound } from "next/navigation";

// Adresse qui ne correspond à aucune page : la 404 du segment [lang], dans la bonne
// langue et sous la barre de démo (le layout racine est dans [lang]).
export default function Missing() {
  notFound();
}
