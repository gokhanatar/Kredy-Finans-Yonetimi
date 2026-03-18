import { useMemo } from "react";
import { Home, Wallet, BarChart3, Users, Menu as MenuIcon, LayoutDashboard } from "lucide-react";
import { useFamilySync } from "@/contexts/FamilySyncContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSimpleMode } from "@/contexts/SimpleModeContext";

export interface NavItem {
  id: string;
  icon: typeof Home;
  labelKey: string;
  path: string;
}

const baseItems: NavItem[] = [
  { id: "home", icon: Home, labelKey: "nav.home", path: "/" },
  { id: "wallet", icon: Wallet, labelKey: "nav.wallet", path: "/wallet" },
  { id: "analytics", icon: BarChart3, labelKey: "nav.analytics", path: "/analytics" },
];

const familyItem: NavItem = { id: "family", icon: Users, labelKey: "nav.family", path: "/family" };
const menuItem: NavItem = { id: "menu", icon: MenuIcon, labelKey: "nav.menu", path: "/menu" };

const simpleHomeItem: NavItem = { id: "home", icon: LayoutDashboard, labelKey: "nav.home", path: "/" };
const simpleMenuItem: NavItem = { id: "menu", icon: MenuIcon, labelKey: "nav.menu", path: "/simple-menu" };
const simpleFamilyItem: NavItem = { id: "family", icon: Users, labelKey: "nav.family", path: "/simple-family" };

export function useNavItems(): NavItem[] {
  const { familyId } = useFamilySync();
  const { profile } = useUserProfile();
  const { isSimpleMode } = useSimpleMode();

  const hidePersonal = !!familyId && !!profile.hidePersonalFinance;

  return useMemo(() => {
    if (isSimpleMode) {
      if (familyId) {
        if (hidePersonal) {
          return [
            { ...simpleFamilyItem, id: 'simple-family', labelKey: 'nav.home' },
            simpleMenuItem,
          ];
        }
        return [simpleHomeItem, simpleFamilyItem, simpleMenuItem];
      }
      return [simpleHomeItem, simpleMenuItem];
    }

    if (familyId) {
      if (hidePersonal) {
        return [baseItems[0], familyItem, baseItems[2], menuItem];
      }
      return [...baseItems.slice(0, 2), familyItem, baseItems[2], menuItem];
    }
    return [...baseItems, menuItem];
  }, [familyId, hidePersonal, isSimpleMode]);
}
