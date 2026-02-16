import { useAuth } from "@/_core/hooks/useAuth";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Settings, 
  LogOut,
  Trophy,
  BarChart3,
  Library,
  Sparkles
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Escenarios", href: "/scenarios", icon: BookOpen },
  { label: "Mis Simulaciones", href: "/simulations", icon: Target },
  { label: "Biblioteca", href: "/response-library", icon: Library },
  { label: "Casos Modelo", href: "/casos-modelo", icon: Award },
  { label: "Coaching IA", href: "/coaching", icon: Sparkles },
  { label: "Mi Progreso", href: "/progress", icon: TrendingUp },
  { label: "Gamificación", href: "/gamification", icon: Trophy },
  { label: "Mi Equipo", href: "/team", icon: Users },
  { label: "Analíticas", href: "/analytics", icon: BarChart3 },
];

export default function TrainingDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Default user for demo mode (no authentication required)
  const currentUser = user || {
    id: 1,
    name: "Usuario Demo",
    email: "demo@kaitel.com",
    role: "admin",
    level: "intermediate",
    points: 0,
  };
  
  const userStatsQuery = trpc.user.stats.useQuery(undefined, { enabled: false });

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      junior: "text-blue-500",
      intermediate: "text-green-500",
      senior: "text-purple-500",
      expert: "text-orange-500",
    };
    return colors[level] || "text-gray-500";
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Kaitel Training</h1>
              <p className="text-xs text-muted-foreground">Powered by Itti</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-border bg-accent/30">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10 bg-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(currentUser.name || "Usuario")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Nivel:</span>
              <span className={getLevelColor(currentUser.level || "junior")}>{currentUser.level || "junior"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Puntos:</span>
              <span className="font-semibold text-primary">{currentUser.points}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-accent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            asChild
          >
            <Link href="/settings">
              <Settings className="w-5 h-5" />
              <span>Configuración</span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
