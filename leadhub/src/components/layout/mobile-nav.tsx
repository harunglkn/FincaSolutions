"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

type Item = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

export function MobileNav({
  items,
  firma,
}: {
  items: Item[];
  firma: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Menue automatisch schliessen, sobald eine Seite gewaehlt wurde
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Hintergrund nicht scrollen, solange das Menue offen ist
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const totalBadge = items.reduce((sum, i) => sum + (i.badge ?? 0), 0);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between bg-white border-b border-ink-200">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menü öffnen"
          className="relative grid place-items-center h-10 w-10 rounded-lg text-ink-700 hover:bg-ink-100"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {totalBadge > 99 ? "99+" : totalBadge}
            </span>
          )}
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl flex flex-col">
            <div className="h-14 px-4 flex items-center justify-between border-b border-ink-100">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Menü schließen"
                className="grid place-items-center h-9 w-9 rounded-lg text-ink-500 hover:bg-ink-100"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                  <path
                    d="m6 6 12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-800"
                        : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                    ].join(" ")}
                  >
                    <span className={active ? "text-brand-700" : "text-ink-400"}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {firma && (
              <div className="px-4 py-4 border-t border-ink-100 text-sm font-semibold text-ink-900 truncate">
                {firma}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
