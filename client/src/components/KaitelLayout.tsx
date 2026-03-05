import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  BookOpen,
  BarChart3,
  Zap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Trophy,
  ChevronRight,
  Shield,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulaciones", label: "Simulaciones", icon: MessageSquare },
  { href: "/desempeno", label: "Mi Desempeño", icon: BarChart3 },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
];

const adminNavItems = [
  { href: "/admin", label: "Panel Admin", icon: Shield },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
];

const levelLabels: Record<string, string> = {
  junior: "Junior",
  intermedio: "Intermedio",
  senior: "Senior",
  experto: "Experto",
};

const levelColors: Record<string, string> = {
  junior: "text-gray-400",
  intermedio: "text-blue-400",
  senior: "text-purple-400",
  experto: "text-yellow-400",
};

export default function KaitelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const { data: profile } = trpc.gamification.profile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">Kaitel</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Training Platform</div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Plataforma de Entrenamiento</h1>
          <p className="text-muted-foreground">Inicia sesión para acceder a las simulaciones</p>
        </div>
        <a
          href={getLoginUrl()}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Iniciar Sesión
        </a>
      </div>
    );
  }

  const isAdmin = user?.role === "admin" || user?.role === "gerente" || user?.role === "supervisor" || user?.role === "coordinador";

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const xpInLevel = profile?.xpInLevel ?? 0;
  const xpNeeded = profile?.xpNeeded ?? 1000;
  const progressPercent = profile?.progressPercent ?? 0;
  const level = profile?.level ?? user?.level ?? "junior";

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold text-sidebar-foreground">Kaitel</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Enterprise</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "")} />
                  {label}
                  {isActive && <ChevronRight className="h-3 w-3 ml-auto text-primary" />}
                </div>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Administración</span>
              </div>
              {adminNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = location.startsWith(href);
                return (
                  <Link key={href} href={href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "")} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Profile Card */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="bg-sidebar-accent rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-sidebar-foreground truncate">
                  {user?.name ?? "Usuario"}
                </div>
                <div className={cn("text-[10px] font-medium", levelColors[level])}>
                  {levelLabels[level]} · {profile?.xpTotal ?? 0} XP
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-1.5 bg-sidebar-border" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{xpInLevel} XP</span>
                <span>{xpNeeded ? `${xpNeeded - xpInLevel} para subir` : "Nivel máximo"}</span>
              </div>
            </div>

            <button
              onClick={() => logoutMutation.mutate()}
              className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
            >
              <LogOut className="h-3 w-3" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
