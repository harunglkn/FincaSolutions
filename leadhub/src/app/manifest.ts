import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finca-Solutions LeadHub",
    short_name: "LeadHub",
    description:
      "Fahrzeug-Leads, Antworten, Einkaufspotenzial und Tagesberichte für freie Autohändler.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#1c2f9b",
    lang: "de",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
