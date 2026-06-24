import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Finca-Solutions LeadHub",
    template: "%s · LeadHub",
  },
  description:
    "Zentrale Plattform für freie Autohändler: Leads, Anfragen, Einkaufspotenzial und Tagesberichte in einem Dashboard.",
  applicationName: "Finca LeadHub",
  appleWebApp: {
    title: "LeadHub",
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c2f9b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ink-50 text-ink-900">
        {children}
      </body>
    </html>
  );
}
