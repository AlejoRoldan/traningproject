import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Scenarios from "./pages/Scenarios";
import SimulationSession from "./pages/SimulationSession";
import Simulations from "./pages/Simulations";
import SimulationDetail from "./pages/SimulationDetail";
import Progress from "./pages/Progress";
import Gamification from "./pages/Gamification";
import Team from "./pages/Team";
import ResponseLibrary from "./pages/ResponseLibrary";
import Coaching from "./pages/Coaching";
import Analytics from "./pages/Analytics";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/scenarios" component={Scenarios} />
      <Route path="/scenarios/:id" component={Scenarios} />
      <Route path="/simulation/start/:scenarioId" component={SimulationSession} />
      <Route path="/simulations" component={Simulations} />
      <Route path="/simulations/:id" component={SimulationDetail} />
      <Route path="/progress" component={Progress} />
      <Route path="/gamification" component={Gamification} />
      <Route path="/team" component={Team} />
      <Route path="/response-library" component={ResponseLibrary} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
