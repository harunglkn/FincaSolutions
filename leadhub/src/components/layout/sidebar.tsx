import { Logo } from "@/components/brand/logo";
import { NavLink } from "@/components/layout/nav-link";
import { mainNav, badgeFor } from "@/components/layout/nav-items";
import type { NavData } from "@/components/layout/nav-data";

function initialsFromEmail(email: string | null) {
  if (!email) return "··";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function Sidebar({ firma, email, unread, todayAppointments }: NavData) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-ink-200 h-screen sticky top-0">
      <div className="h-16 px-5 flex items-center border-b border-ink-100">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 text-[11px] uppercase tracking-widest font-semibold text-ink-400 mb-2">
          Arbeitsbereich
        </p>
        {mainNav.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            badge={badgeFor(item.href, { unread, todayAppointments })}
          />
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-ink-100">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-9 w-9 rounded-full bg-brand-100 text-brand-800 font-semibold text-sm">
            {initialsFromEmail(email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">
              {firma ?? email ?? "Gast"}
            </p>
            <p className="text-xs text-ink-500 truncate">
              {firma ? email : "Finca-Solutions"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
