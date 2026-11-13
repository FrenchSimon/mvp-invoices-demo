import type { AuthError } from "@supabase/supabase-js";

// Messages en français pour les erreurs Supabase les plus courantes.
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email ou mot de passe incorrect.";
    case "email_not_confirmed":
      return "Confirmez d'abord votre adresse : ouvrez le lien reçu par email.";
    case "weak_password":
      return "Mot de passe trop faible. Utilisez au moins 8 caractères.";
    case "same_password":
      return "Choisissez un mot de passe différent de l'ancien.";
    case "email_address_invalid":
      return "Adresse email invalide.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    case "signup_disabled":
      return "Les inscriptions sont fermées pour le moment.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}
