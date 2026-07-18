import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getNavData } from "@/components/layout/nav-data";
import { mainNav, badgeFor } from "@/components/layout/nav-items";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getNavData();
  const mobileItems = mainNav.map((item) => ({
    ...item,
    badge: badgeFor(item.href, navData),
  }));

  return (
    <div className="flex-1 flex flex-col">
      <MobileNav items={mobileItems} firma={navData.firma} />
      <div className="flex-1 flex">
        <Sidebar {...navData} />
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}
