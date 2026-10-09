// Formats de saisie partagés entre le formulaire (navigateur) et la fonction serveur
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_RE = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/ // numéro français : 06 12 34 56 78 ou +33 6…
export const POSTAL_CODE_RE = /^\d{5}$/
