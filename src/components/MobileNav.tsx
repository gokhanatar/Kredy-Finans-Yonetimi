import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { useNavItems } from "@/hooks/useNavItems";

interface MobileNavProps {
  activeTab: string;
}

export function MobileNav({ activeTab }: MobileNavProps) {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = useNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl safe-area-bottom lg:hidden">
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
                navigate(item.path);
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
