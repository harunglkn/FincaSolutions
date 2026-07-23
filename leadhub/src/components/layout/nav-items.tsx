// Gemeinsame Navigations-Definition fuer Desktop-Sidebar UND Handy-Menue.
// Bewusst OHNE Server-Imports, damit sie auch in Client-Komponenten nutzbar ist.

import type { ReactNode } from "react";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon d="M3 12 12 4l9 8M5 10v10h14V10" />,
  },
  {
    label: "Suchlauf",
    href: "/suchlauf",
    icon: <Icon d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM20 20l-4.35-4.35" />,
  },
  {
    label: "Posteingang",
    href: "/posteingang",
    icon: (
      <Icon d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
    ),
  },
  {
    label: "Leads",
    href: "/leads",
    icon: <Icon d="M4 6h16M4 12h16M4 18h10" />,
  },
  {
    label: "Termine",
    href: "/termine",
    icon: (
      <Icon d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    ),
  },
  {
    label: "Berichte",
    href: "/berichte",
    icon: <Icon d="M4 19V5m6 14V9m6 10v-6m4 6H4" />,
  },
  {
    label: "Einstellungen",
    href: "/einstellungen",
    icon: (
      <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2L5.1 6 3.1 9.3l2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
    ),
  },
];

// Badge-Zuordnung: welcher Menuepunkt zeigt welche Zahl?
export function badgeFor(
  href: string,
  counts: { unread: number; todayAppointments: number },
): number | undefined {
  if (href === "/posteingang") return counts.unread;
  if (href === "/termine") return counts.todayAppointments;
  return undefined;
}
