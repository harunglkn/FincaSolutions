"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: number;
};

export function NavLink({ href, icon, label, badge }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-brand-50 text-brand-800"
          : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
      ].join(" ")}
    >
      <span className={active ? "text-brand-700" : "text-ink-400"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-sm"
          title={`${badge} ungelesene Antworten`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
