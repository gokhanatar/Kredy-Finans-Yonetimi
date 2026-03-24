import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Wallet, BarChart3, Users, Menu as MenuIcon, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { useFamilySync } from "@/contexts/FamilySyncContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSimpleMode } from "@/contexts/SimpleModeContext";

interface NavItem {
  id: string;
  icon: typeof Home;
  labelKey: string;
  path: string;
}

interface MobileNavProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

const baseItems: NavItem[] = [
  { id: "home", icon: Home, labelKey: "nav.home", path: "/" },
  { id: "wallet", icon: Wallet, labelKey: "nav.wallet", path: "/wallet" },
  { id: "analytics", icon: BarChart3, labelKey: "nav.analytics", path: "/analytics" },
];

const familyItem: NavItem = { id: "family", icon: Users, labelKey: "nav.family", path: "/family" };
const menuItem: NavItem = { id: "menu", icon: MenuIcon, labelKey: "nav.menu", path: "/menu" };

// Simple mode items
const simpleHomeItem: NavItem = { id: "home", icon: LayoutDashboard, labelKey: "nav.home", path: "/" };
const simpleMenuItem: NavItem = { id: "menu", icon: MenuIcon, labelKey: "nav.menu", path: "/simple-menu" };
const simpleFamilyItem: NavItem = { id: "family", icon: Users, labelKey: "nav.family", path: "/simple-family" };

export function MobileNav({ activeTab }: MobileNavProps) {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { familyId } = useFamilySync();
  const { profile } = useUserProfile();
  const { isSimpleMode } = useSimpleMode();

  const hidePersonal = !!familyId && !!profile.hidePersonalFinance;

  const navItems = useMemo(() => {
    // Simple Mode: 2-3 tabs
    if (isSimpleMode) {
      if (familyId) {
        if (hidePersonal) {
          // Kişisel finans kapalı → Home=Aile, ayrı Family tab yok
          return [
            { ...simpleFamilyItem, id: 'home', labelKey: 'nav.home' },
            simpleMenuItem,
          ];
        }
        return [simpleHomeItem, simpleFamilyItem, simpleMenuItem];
      }
      return [simpleHomeItem, simpleMenuItem];
    }

    // Detail Mode (existing): 4-5 tabs
    if (familyId) {
      if (hidePersonal) {
        return [baseItems[0], familyItem, baseItems[2], menuItem];
      }
      return [...baseItems.slice(0, 2), familyItem, baseItems[2], menuItem];
    }
    return [...baseItems, menuItem];
  }, [familyId, hidePersonal, isSimpleMode]);

  const handleTabClick = (item: NavItem) => {
    navigate(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto max-w-2xl flex items-center justify-around px-0 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id ||
            (item.id === 'home' && location.pathname === '/' && activeTab === 'home');

          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTabClick(item);
              }}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1 transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-all",
                      isActive && "scale-110"
                    )}
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium leading-tight">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
