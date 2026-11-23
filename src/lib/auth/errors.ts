import type { AuthError } from "@supabase/supabase-js";
import type { Dictionary } from "@/i18n/dictionaries";

// Messages traduits pour les erreurs Supabase les plus courantes.
export function authErrorMessage(error: AuthError, t: Dictionary): string {
  const e = t.auth.errors;
  switch (error.code) {
    case "invalid_credentials":
      return e.invalidCredentials;
    case "email_not_confirmed":
      return e.emailNotConfirmed;
    case "weak_password":
      return e.weakPassword;
    case "same_password":
      return e.samePassword;
    case "email_address_invalid":
      return e.invalidEmail;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return e.rateLimit;
    case "signup_disabled":
      return e.signupDisabled;
    default:
      return e.generic;
  }
}
