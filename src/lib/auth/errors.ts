import type { AuthError } from "@supabase/supabase-js";

// Messages en anglais pour les erreurs Supabase les plus courantes.
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email first: open the link we sent you.";
    case "weak_password":
      return "Password too weak. Use at least 8 characters.";
    case "same_password":
      return "Choose a password different from your old one.";
    case "email_address_invalid":
      return "Invalid email address.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Try again in a few minutes.";
    case "signup_disabled":
      return "Sign-ups are closed for now.";
    default:
      return "Something went wrong. Try again in a moment.";
  }
}
