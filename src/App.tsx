import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FamilySyncProvider } from "@/contexts/FamilySyncContext";
import { PrivacyModeProvider } from "@/contexts/PrivacyModeContext";
import { CloudAuthProvider } from "@/contexts/CloudAuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SimpleModeProvider, useSimpleMode } from "@/contexts/SimpleModeContext";
import { runDataMigrationV2 } from "@/lib/dataMigration";
import { initNotificationBridge, NOTIFICATION_TAP_NAV, consumePendingTapNav } from "@/lib/notificationBridge";
import { PinLockScreen } from "@/components/PinLockScreen";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { NotificationScheduler } from "@/components/NotificationScheduler";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Menu = lazy(() => import("./pages/Menu"));
const Family = lazy(() => import("./pages/Family"));
const Subscription = lazy(() => import("./pages/Subscription"));
const PurchaseHistory = lazy(() => import("./pages/PurchaseHistory"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const NotificationInbox = lazy(() => import("./pages/NotificationInbox"));
const CommercialCardAnalytics = lazy(() => import("./pages/CommercialCardAnalytics"));
const AssetManagement = lazy(() => import("./pages/AssetManagement"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const LoanSimulator = lazy(() => import("./pages/LoanSimulator"));
const Investments = lazy(() => import("./pages/Investments"));
const WidgetGallery = lazy(() => import("./pages/WidgetGallery"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const SimpleSummary = lazy(() => import("./pages/SimpleSummary"));
const SimpleFamily = lazy(() => import("./pages/SimpleFamily"));
const SimpleMenu = lazy(() => import("./pages/SimpleMenu"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Run data migration before app renders
try { runDataMigrationV2(); } catch {}
try { initNotificationBridge(); } catch {}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function DeepLinkHandler() {
  const navigate = useNavigate();
  useDeepLinking();
  useWidgetSync();

  useEffect(() => {
    // Mount'ta pending tap nav varsa hemen navigate et
    const pending = consumePendingTapNav();
    if (pending) {
      navigate(`/notification-inbox?assetType=${pending.assetType}&assetId=${pending.assetId}`);
    }

    // Sonraki tap event'leri icin listener
    function handleTapNav(e: Event) {
      const { assetType, assetId } = (e as CustomEvent).detail;
      // Pending'i temizle (zaten consume edildi veya event'ten geliyor)
      consumePendingTapNav();
      navigate(`/notification-inbox?assetType=${assetType}&assetId=${assetId}`);
    }
    window.addEventListener(NOTIFICATION_TAP_NAV, handleTapNav);
    return () => window.removeEventListener(NOTIFICATION_TAP_NAV, handleTapNav);
  }, [navigate]);

  return null;
}

function SimpleModeHome() {
  const { isSimpleMode } = useSimpleMode();
  return isSimpleMode ? <SimpleSummary /> : <Index />;
}

function SimpleModeFamily() {
  const { isSimpleMode } = useSimpleMode();
  return isSimpleMode ? <SimpleFamily /> : <Family />;
}

function AppContent() {
  useTheme();
  useLanguage();
  const { isLocked, isPinSet } = useAuth();

  if (isPinSet && isLocked) {
    return <PinLockScreen />;
  }

  return (
    <>
      <NotificationScheduler />
      <BrowserRouter>
        <DeepLinkHandler />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<SimpleModeHome />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/family" element={<SimpleModeFamily />} />
          {/* Simple mode dedicated routes */}
          <Route path="/simple-menu" element={<SimpleMenu />} />
          <Route path="/simple-family" element={<SimpleFamily />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/purchases" element={<PurchaseHistory />} />
          <Route path="/notifications" element={<NotificationSettings />} />
          <Route path="/notification-inbox" element={<NotificationInbox />} />
          <Route path="/commercial-analytics" element={<CommercialCardAnalytics />} />
          <Route path="/assets" element={<AssetManagement />} />
          <Route path="/settings" element={<AccountSettings />} />
          <Route path="/help" element={<HelpSupport />} />
          <Route path="/loans" element={<LoanSimulator />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/widgets" element={<WidgetGallery />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          {/* Redirects from old/alternate routes */}
          <Route path="/finance" element={<Navigate to="/wallet" replace />} />
          <Route path="/family-finance" element={<Navigate to="/family" replace />} />
          <Route path="/personal-finance" element={<Navigate to="/wallet" replace />} />
          <Route path="/purchase-history" element={<Navigate to="/purchases" replace />} />
          <Route path="/widget-gallery" element={<Navigate to="/widgets" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CloudAuthProvider>
          <SubscriptionProvider>
            <FamilySyncProvider>
              <SimpleModeProvider>
                <PrivacyModeProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <AppContent />
                  </TooltipProvider>
                </PrivacyModeProvider>
              </SimpleModeProvider>
            </FamilySyncProvider>
          </SubscriptionProvider>
        </CloudAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
