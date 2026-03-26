import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { DashboardLayout } from "./components/DashboardLayout";

const Dashboard = lazy(() => import("./pages/Dashboard").then((mod) => ({ default: mod.Dashboard })));
const MarketSearch = lazy(() => import("./pages/MarketSearch").then((mod) => ({ default: mod.MarketSearch })));
const CardDetail = lazy(() => import("./pages/CardDetail").then((mod) => ({ default: mod.CardDetail })));
const PlayerDetail = lazy(() => import("./pages/PlayerDetail").then((mod) => ({ default: mod.PlayerDetail })));
const Scanner = lazy(() => import("./pages/Scanner").then((mod) => ({ default: mod.Scanner })));
const Players = lazy(() => import("./pages/Players").then((mod) => ({ default: mod.Players })));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage").then((mod) => ({ default: mod.WatchlistPage })));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage").then((mod) => ({ default: mod.PortfolioPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((mod) => ({ default: mod.ReportsPage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then((mod) => ({ default: mod.NotificationsPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((mod) => ({ default: mod.SettingsPage })));
const TrendHistoryPage = lazy(() => import("./pages/TrendHistoryPage").then((mod) => ({ default: mod.TrendHistoryPage })));
const BoxesPage = lazy(() => import("./pages/BoxesPage").then((mod) => ({ default: mod.BoxesPage })));
const BoxDetailPage = lazy(() => import("./pages/BoxDetailPage").then((mod) => ({ default: mod.BoxDetailPage })));
const RelationshipMapPage = lazy(() => import("./pages/RelationshipMapPage").then((mod) => ({ default: mod.RelationshipMapPage })));
const SignalCenterPage = lazy(() => import("./pages/SignalCenterPage").then((mod) => ({ default: mod.SignalCenterPage })));
const MultiPlatformPage = lazy(() => import("./pages/MultiPlatformPage").then((mod) => ({ default: mod.MultiPlatformPage })));

function AppFallback() {
  return <div className="flex w-full items-center justify-center p-8 text-muted-foreground">页面加载中...</div>;
}

function Router() {
  return (
    <Suspense fallback={<AppFallback />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/market" component={MarketSearch} />
        <Route path="/players" component={Players} />
        <Route path="/card/:id" component={CardDetail} />
        <Route path="/players/:id" component={PlayerDetail} />
        <Route path="/watchlist" component={WatchlistPage} />
        <Route path="/portfolio" component={PortfolioPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/trends" component={TrendHistoryPage} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/boxes" component={BoxesPage} />
        <Route path="/boxes/:id" component={BoxDetailPage} />
        <Route path="/graph" component={RelationshipMapPage} />
        <Route path="/signals" component={SignalCenterPage} />
        <Route path="/multiplatform" component={MultiPlatformPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route>
          <div className="flex w-full items-center justify-center p-8 text-muted-foreground">未找到该页面 (404)</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        <Router />
      </DashboardLayout>
    </div>
  );
}
