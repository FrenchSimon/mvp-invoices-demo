import type { Dictionary } from "../dictionaries";

export const auth: Dictionary["auth"] = {
  email: "E-mail",
  password: "Mot de passe",
  passwordHint: "8 caractères minimum.",
  login: {
    title: "Se connecter",
    intro: "Retrouvez vos clients et vos factures.",
    forgot: "Mot de passe oublié ?",
    submit: "Se connecter",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    lookingAround: "Vous voulez juste jeter un œil ?",
    linkError:
      "Ce lien n'est plus valable (déjà utilisé, expiré ou ouvert dans un autre navigateur). Connectez-vous, ou demandez un nouveau lien.",
  },
  signup: {
    title: "Créer un compte",
    intro: "Gratuit jusqu'à 3 factures par mois. Sans carte bancaire.",
    haveAccount: "Vous avez déjà un compte ?",
    login: "Se connecter",
    acceptBefore: "J'accepte les",
    terms: "conditions d'utilisation",
    acceptAnd: "et la",
    privacy: "politique de confidentialité",
    acceptAfter: ".",
    submit: "Créer mon compte",
  },
  forgot: {
    title: "Mot de passe oublié",
    intro: "Indiquez votre e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.",
    submit: "Recevoir le lien",
    back: "Retour à la connexion",
  },
  reset: {
    title: "Nouveau mot de passe",
    intro: "Choisissez un nouveau mot de passe pour votre compte.",
    password: "Nouveau mot de passe",
    confirm: "Confirmez le mot de passe",
  },
  demo: {
    open: "Essayer la démo",
    opening: "Ouverture de la démo…",
  },
  messages: {
    enterEmail: "Indiquez votre adresse e-mail.",
    passwordTooShort: "Votre mot de passe doit contenir au moins {min} caractères.",
    acceptTerms: "Merci d'accepter les conditions d'utilisation et la politique de confidentialité.",
    checkEmail: "C'est presque fini : ouvrez le lien envoyé à {email} pour activer votre compte.",
    enterEmailPassword: "Indiquez votre e-mail et votre mot de passe.",
    resetSent:
      "Si un compte existe pour {email}, nous vous avons envoyé un lien pour choisir un nouveau mot de passe.",
    passwordsDiffer: "Les deux mots de passe ne correspondent pas.",
    resetExpired: "Ce lien a expiré. Demandez-en un nouveau depuis « Mot de passe oublié ».",
    demoRateLimit: "Trop de sessions de démo depuis votre réseau. Réessayez dans un moment.",
    demoUnavailable: "La démo n'est pas disponible pour le moment. Réessayez plus tard.",
  },
  errors: {
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    emailNotConfirmed: "Confirmez d'abord votre e-mail : ouvrez le lien que nous vous avons envoyé.",
    weakPassword: "Mot de passe trop faible. Utilisez au moins 8 caractères.",
    samePassword: "Choisissez un mot de passe différent de l'ancien.",
    invalidEmail: "Adresse e-mail invalide.",
    rateLimit: "Trop de tentatives. Réessayez dans quelques minutes.",
    signupDisabled: "Les inscriptions sont fermées pour le moment.",
    generic: "Une erreur est survenue. Réessayez dans un instant.",
  },
};
