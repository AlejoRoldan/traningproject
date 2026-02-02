import { useAuth } from "@/_core/hooks/useAuth";
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
  BarChart3
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["agent", "supervisor", "trainer", "admin"] },
  { label: "Escenarios", href: "/scenarios", icon: BookOpen, roles: ["agent", "supervisor", "trainer", "admin"] },
  { label: "Mis Simulaciones", href: "/simulations", icon: Target, roles: ["agent", "supervisor", "trainer", "admin"] },
  { label: "Mi Progreso", href: "/progress", icon: TrendingUp, roles: ["agent"] },
  { label: "Gamificación", href: "/gamification", icon: Trophy, roles: ["agent"] },
  { label: "Mi Equipo", href: "/team", icon: Users, roles: ["supervisor", "trainer", "admin"] },
  { label: "Analíticas", href: "/analytics", icon: BarChart3, roles: ["supervisor", "trainer", "admin"] },
];

export default function TrainingDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const userStatsQuery = trpc.user.stats.useQuery(undefined, { enabled: !!user });

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <div className="w-64 bg-card border-r border-border p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Acceso Restringido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para acceder a la plataforma</p>
          <Button asChild>
            <a href="/api/oauth/login">Iniciar Sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case "expert": return "text-primary font-bold";
      case "senior": return "text-chart-4 font-semibold";
      case "intermediate": return "text-chart-2";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-card border-r border-border flex flex-col">
        {/* Logo and Brand */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Kaitel Training</h1>
              <p className="text-xs text-muted-foreground">Powered by Itti</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-border bg-accent/30">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          
          {user.role === "agent" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Nivel:</span>
                <span className={getLevelColor(user.level)}>{user.level || "junior"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Puntos:</span>
                <span className="font-semibold text-primary">{user.points || 0}</span>
              </div>
              {userStatsQuery.data && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Promedio:</span>
                  <span className="font-semibold text-foreground">{userStatsQuery.data.averageScore}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/settings" className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              Configuración
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
