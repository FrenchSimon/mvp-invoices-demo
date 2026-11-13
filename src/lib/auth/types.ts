// État renvoyé par les actions des formulaires de connexion.
export type FormState = {
  error?: string;
  message?: string;
  // Valeur saisie, remise dans le champ après une erreur.
  email?: string;
};
