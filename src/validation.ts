import type { RegistrationInput } from "./types";

export type FormErrors = Partial<Record<keyof RegistrationInput, string>>;

export function validateRegistration(data: RegistrationInput): FormErrors {
  const errors: FormErrors = {};
  if (!data.lastName.trim()) errors.lastName = "Veuillez renseigner votre nom.";
  if (!data.firstName.trim())
    errors.firstName = "Veuillez renseigner votre prénom.";
  if (!data.email.trim())
    errors.email = "Veuillez renseigner votre adresse email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = "L'adresse email semble incorrecte.";
  if (!/^\d{5}$/.test(data.postalCode))
    errors.postalCode = "Le code postal doit comporter 5 chiffres.";
  if (!Number.isInteger(data.adults) || data.adults < 0)
    errors.adults = "Saisissez un nombre valide.";
  if (!Number.isInteger(data.children) || data.children < 0)
    errors.children = "Saisissez un nombre valide.";
  if (!data.consent)
    errors.consent = "Votre accord est nécessaire pour valider l’inscription.";
  return errors;
}
