import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import KaitelLayout from "./components/KaitelLayout";
import Dashboard from "./pages/Dashboard";
import Simulations from "./pages/Simulations";
import SimulationSession from "./pages/SimulationSession";
import Performance from "./pages/Performance";
import Ranking from "./pages/Ranking";
import Library from "./pages/Library";

function Router() {
  return (
    <KaitelLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/simulaciones" component={Simulations} />
        <Route path="/simulaciones/:id" component={SimulationSession} />
        <Route path="/desempeno" component={Performance} />
        <Route path="/ranking" component={Ranking} />
        <Route path="/biblioteca" component={Library} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </KaitelLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
