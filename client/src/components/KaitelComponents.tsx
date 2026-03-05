import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target, Flame, Star, Trophy, Shield, Heart, Zap,
  BookOpen, MessageSquare, BarChart3, Clock, Users
} from "lucide-react";

// ─── Difficulty Badge ─────────────────────────────────────────────────────────

const difficultyConfig = {
  facil: { label: "Fácil", className: "diff-facil" },
  medio: { label: "Medio", className: "diff-medio" },
  dificil: { label: "Difícil", className: "diff-dificil" },
  experto: { label: "Experto", className: "diff-experto" },
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] ?? { label: difficulty, className: "" };
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", config.className)}>
      {config.label}
    </span>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

const categoryConfig = {
  reclamos: { label: "Reclamos", className: "cat-reclamos" },
  productos: { label: "Productos", className: "cat-productos" },
  ventas: { label: "Ventas", className: "cat-ventas" },
  cobranzas: { label: "Cobranzas", className: "cat-cobranzas" },
  onboarding: { label: "Onboarding", className: "cat-onboarding" },
  fraude: { label: "Fraude", className: "cat-fraude" },
};

export function CategoryBadge({ category }: { category: string }) {
  const config = categoryConfig[category as keyof typeof categoryConfig] ?? { label: category, className: "" };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md", config.className)}>
      {config.label}
    </span>
  );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────

const levelConfig = {
  junior: { label: "Junior", className: "level-junior" },
  intermedio: { label: "Intermedio", className: "level-intermedio" },
  senior: { label: "Senior", className: "level-senior" },
  experto: { label: "Experto", className: "level-experto" },
};

export function LevelBadge({ level }: { level: string }) {
  const config = levelConfig[level as keyof typeof levelConfig] ?? { label: level, className: "" };
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", config.className)}>
      {config.label}
    </span>
  );
}

// ─── XP Badge ─────────────────────────────────────────────────────────────────

export function XPBadge({ xp }: { xp: number }) {
  return (
    <span className="xp-badge">+{xp} XP</span>
  );
}

// ─── Score Circle ─────────────────────────────────────────────────────────────

export function ScoreCircle({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { outer: "w-14 h-14", text: "text-lg", label: "text-[10px]" },
    md: { outer: "w-20 h-20", text: "text-2xl", label: "text-xs" },
    lg: { outer: "w-28 h-28", text: "text-4xl", label: "text-sm" },
  };

  const s = sizes[size];
  const color = score >= 85 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-red-400";
  const strokeColor = score >= 85 ? "oklch(0.65 0.18 160)" : score >= 70 ? "oklch(0.82 0.18 85)" : "oklch(0.60 0.22 25)";

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", s.outer)}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="oklch(0.22 0.01 240)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className={cn("font-bold leading-none", s.text, color)}>{score}</span>
        <span className={cn("text-muted-foreground", s.label)}>/100</span>
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  color?: "default" | "green" | "yellow" | "blue" | "purple";
}) {
  const colors = {
    default: "text-muted-foreground bg-muted/30",
    green: "text-primary bg-primary/15",
    yellow: "text-yellow-400 bg-yellow-900/20",
    blue: "text-blue-400 bg-blue-900/20",
    purple: "text-purple-400 bg-purple-900/20",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", colors[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground font-medium">{title}</div>
        <div className="text-xl font-bold text-foreground leading-tight">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {trend && (
        <div className="text-xs text-primary font-medium">{trend}</div>
      )}
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

export function ScoreBar({
  label,
  score,
  trend,
  icon,
  description,
}: {
  label: string;
  score: number;
  trend?: number;
  icon?: string;
  description?: string;
}) {
  const color = score >= 85 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500";
  const trendColor = trend && trend > 0 ? "text-green-400" : trend && trend < 0 ? "text-red-400" : "text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <div>
            <div className="text-sm font-semibold text-foreground">{label}</div>
            {description && <div className="text-xs text-muted-foreground">{description}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{score}</span>
          {trend !== undefined && (
            <span className={cn("text-xs font-medium", trendColor)}>
              {trend > 0 ? `+${trend}` : trend}
            </span>
          )}
        </div>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Badge Icon ───────────────────────────────────────────────────────────────

const badgeIcons: Record<string, React.ElementType> = {
  Target, Flame, Star, Trophy, Shield, Heart, Zap,
  BookOpen, MessageSquare, BarChart3, Clock, Users,
};

export function BadgeIcon({ iconName, earned = true }: { iconName: string | null; earned?: boolean }) {
  const Icon = (iconName && badgeIcons[iconName]) ? badgeIcons[iconName] : Star;
  return (
    <div className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
      earned
        ? "bg-primary/15 border-primary/30 text-primary"
        : "bg-muted/30 border-border text-muted-foreground opacity-40"
    )}>
      <Icon className="h-6 w-6" />
    </div>
  );
}

// ─── Competency Tag ───────────────────────────────────────────────────────────

export function CompetencyTag({ name }: { name: string }) {
  return (
    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md border border-border">
      {name}
    </span>
  );
}

// ─── Resource Type Badge ──────────────────────────────────────────────────────

const typeConfig: Record<string, { label: string; color: string }> = {
  guia: { label: "Guía", color: "bg-blue-900/30 text-blue-400" },
  video: { label: "Video", color: "bg-purple-900/30 text-purple-400" },
  procedimiento: { label: "Procedimiento", color: "bg-orange-900/30 text-orange-400" },
  checklist: { label: "Checklist", color: "bg-green-900/30 text-green-400" },
  ficha: { label: "Ficha", color: "bg-yellow-900/30 text-yellow-400" },
  referencia: { label: "Referencia", color: "bg-pink-900/30 text-pink-400" },
};

export function ResourceTypeBadge({ type }: { type: string }) {
  const config = typeConfig[type] ?? { label: type, color: "bg-secondary text-secondary-foreground" };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md", config.color)}>
      {config.label}
    </span>
  );
}

// ─── Weekly Progress ──────────────────────────────────────────────────────────

export function WeeklyProgress({
  completedDays,
  completedSimulations,
  requiredSimulations,
}: {
  completedDays: string[];
  completedSimulations: number;
  requiredSimulations: number;
}) {
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1 + i);
    days.push({
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("es", { weekday: "short" }).slice(0, 3),
      isToday: d.toDateString() === today.toDateString(),
    });
  }

  const percent = Math.min(100, Math.round((completedSimulations / requiredSimulations) * 100));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {days.map(({ date, label, isToday }) => {
          const completed = completedDays.includes(date);
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all",
                completed
                  ? "bg-primary text-primary-foreground border-primary"
                  : isToday
                    ? "border-primary/50 text-primary bg-primary/10"
                    : "border-border text-muted-foreground"
              )}>
                {completed ? "✓" : label[0].toUpperCase()}
              </div>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedSimulations} de {requiredSimulations} simulaciones obligatorias</span>
          <span className="text-primary font-medium">{percent}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="typing-dot w-2 h-2 rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
