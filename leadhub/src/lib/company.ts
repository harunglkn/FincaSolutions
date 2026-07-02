/**
 * Zentrale Firmen-/Anbieterdaten fuer Impressum, Datenschutz und Footer.
 * Aenderungen hier wirken automatisch auf allen Rechtsseiten.
 */
export const COMPANY = {
  brand: "Finca Solutions",

  // Firmierung (Einzelunternehmen)
  legalName: "FincaSolutions",
  owner: "Gültekin Harun",

  // Ladungsfaehige Anschrift
  street: "Robert-Bosch-Straße 4",
  zipCity: "64319 Pfungstadt",
  country: "Deutschland",

  email: "harunglkn@gmail.com",
  phone: "0170 2333592",
  website: "https://www.finca-solutions.de",

  // Steuer: Einzelunternehmen mit Steuernummer, keine USt-IdNr., kein Handelsregister.
  taxNumber: "007 823 32361", // Steuernummer (freiwillige Angabe)
  vatId: "", // USt-IdNr. – nicht vorhanden
  register: "", // kein Handelsregistereintrag (Einzelunternehmen)
} as const;
