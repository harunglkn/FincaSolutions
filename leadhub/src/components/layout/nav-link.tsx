"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  // "dark" fuer die dunkle Premium-Sidebar, "light" fuer helle Flaechen
  appearance?: "light" | "dark";
};

export function NavLink({
  href,
  icon,
  label,
  badge,
  appearance = "light",
}: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  const linkCls =
    appearance === "dark"
      ? active
        ? "bg-white/10 text-white"
        : "text-ink-400 hover:bg-white/5 hover:text-white"
      : active
        ? "bg-brand-50 text-brand-800"
        : "text-ink-600 hover:bg-ink-100 hover:text-ink-900";

  const iconCls =
    appearance === "dark"
      ? active
        ? "text-accent-400"
        : "text-ink-500"
      : active
        ? "text-brand-700"
        : "text-ink-400";

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        linkCls,
      ].join(" ")}
    >
      <span className={iconCls}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-sm"
          title={`${badge} offen`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
