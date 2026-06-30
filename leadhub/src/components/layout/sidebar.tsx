import { Logo } from "@/components/brand/logo";
import { NavLink } from "@/components/layout/nav-link";
import { createClient } from "@/lib/supabase/server";

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

const mainNav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon d="M3 12 12 4l9 8M5 10v10h14V10" />,
  },
  {
    label: "Posteingang",
    href: "/posteingang",
    icon: <Icon d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />,
  },
  {
    label: "Leads",
    href: "/leads",
    icon: <Icon d="M4 6h16M4 12h16M4 18h10" />,
  },
  {
    label: "Kampagnen",
    href: "/kampagnen",
    icon: <Icon d="M3 11l18-7-7 18-3-8-8-3Z" />,
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

const adminNav = [
  {
    label: "Adminbereich",
    href: "/admin",
    icon: <Icon d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4Z" />,
  },
];

function initialsFromEmail(email: string | undefined) {
  if (!email) return "··";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email;

  const [{ data: profile }, { count: unreadCount }] = user
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("firma")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("has_unread_seller_message", true),
      ])
    : [{ data: null }, { count: 0 }];
  const firma = profile?.firma ?? null;
  const unread = unreadCount ?? 0;

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
            badge={item.href === "/posteingang" ? unread : undefined}
          />
        ))}

        <p className="px-3 mt-6 text-[11px] uppercase tracking-widest font-semibold text-ink-400 mb-2">
          Verwaltung
        </p>
        {adminNav.map((item) => (
          <NavLink key={item.href} {...item} />
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
