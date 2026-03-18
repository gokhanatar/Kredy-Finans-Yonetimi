import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";

interface AppLayoutProps {
  children: ReactNode;
}

// Pages that show the bottom nav / sidebar
const NAV_PAGES = new Set([
  "/", "/wallet", "/analytics", "/menu", "/family",
  "/simple-menu", "/simple-family",
  "/commercial-analytics", "/investments", "/ai-insights",
  "/widgets", "/family-finance",
]);

function getActiveTab(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/wallet") return "wallet";
  if (pathname === "/analytics") return "analytics";
  if (pathname === "/menu" || pathname === "/simple-menu") return "menu";
  if (pathname === "/family" || pathname === "/simple-family" || pathname === "/family-finance") return "family";
  return "home";
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const showNav = NAV_PAGES.has(location.pathname);

  return (
    <div className="lg:flex min-h-screen">
      {showNav && <AppSidebar />}
      <main className={showNav ? "flex-1 lg:ml-64" : "flex-1"}>
        {children}
      </main>
      {showNav && <MobileNav activeTab={getActiveTab(location.pathname)} />}
    </div>
  );
}
