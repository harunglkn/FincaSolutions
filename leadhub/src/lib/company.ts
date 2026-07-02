/**
 * Zentrale Firmen-/Anbieterdaten fuer Impressum, Datenschutz und Footer.
 *
 * >>> WICHTIG: Bitte die mit TODO markierten Felder mit deinen echten
 * >>> rechtlichen Angaben ausfuellen, BEVOR du die Seite Kunden zeigst.
 * >>> In Deutschland sind Name + ladungsfaehige Anschrift Pflicht (Impressum).
 */
export const COMPANY = {
  brand: "Finca Solutions",

  // TODO: vollstaendiger Name bzw. Firmierung (z.B. "Max Mustermann" oder "Finca Solutions GmbH")
  legalName: "Finca Solutions – Inhaber Harun Gülakan",

  // TODO: ladungsfaehige Anschrift
  street: "Musterstraße 1",
  zipCity: "00000 Musterstadt",
  country: "Deutschland",

  email: "harunglkn@gmail.com",

  // TODO: geschaeftliche Telefonnummer (optional, aber empfohlen)
  phone: "",

  // TODO: nur falls vorhanden (Einzelunternehmer brauchen das i.d.R. nicht)
  vatId: "", // USt-IdNr.
  register: "", // z.B. "Amtsgericht Musterstadt, HRB 12345"
} as const;
