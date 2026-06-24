"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
};

export function NavLink({ href, icon, label }: NavLinkProps) {
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
      {label}
    </Link>
  );
}
