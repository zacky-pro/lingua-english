import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  Flame,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  LayoutGrid,
  LineChart,
  type LucideIcon,
  Menu,
  MessageCircle,
  Mic,
  PenLine,
  Search,
  Settings,
  Sparkles,
  SpellCheck,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { GlobalSearch } from "@/components/lingua/GlobalSearch";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useLingua";
import { cn } from "@/lib/utils";
import { xpLevel } from "@/lib/lingua";

type NavItem = { to: string; label: string; icon: LucideIcon };

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Home },
      { to: "/learn", label: "Learn", icon: GraduationCap },
      { to: "/library", label: "Library", icon: LayoutGrid },
    ],
  },
  {
    title: "Practice",
    items: [
      { to: "/vocabulary", label: "Vocabulary", icon: BookOpen },
      { to: "/grammar", label: "Grammar", icon: SpellCheck },
      { to: "/listening", label: "Listening", icon: Headphones },
      { to: "/speaking", label: "Speaking", icon: Mic },
      { to: "/live", label: "Ngobrol Live", icon: Sparkles },
      { to: "/conversation", label: "Real Talk", icon: MessageCircle },
      { to: "/reading", label: "Reading", icon: BookOpen },
      { to: "/writing", label: "Writing", icon: PenLine },
    ],
  },
  {
    title: "Assist",
    items: [
      { to: "/tutor", label: "AI Tutor", icon: Brain },
      { to: "/translate", label: "Translate", icon: Languages },
    ],
  },
  {
    title: "You",
    items: [
      { to: "/progress", label: "Progress", icon: LineChart },
      { to: "/achievements", label: "Achievements", icon: Award },
      { to: "/leaderboard", label: "Leaderboard", icon: Sparkles },
      { to: "/profile", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const MOBILE_NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/vocabulary", label: "Practice", icon: BookOpen },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User },
];

function useActivePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useActivePath();
  return (
    <nav className="flex flex-col gap-5" aria-label="Main">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-1">
      <span className="grid size-9 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow">
        <Zap className="size-5" aria-hidden />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">LINGUA</span>
    </Link>
  );
}

/** Applies theme + reduced motion preferences from the learner profile. */
function usePreferences(theme?: string, reduceMotion?: boolean) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = theme === "dark" || (theme === "system" && prefersDark);
    root.classList.toggle("dark", dark);
    root.classList.toggle("reduce-motion", !!reduceMotion);
  }, [theme, reduceMotion]);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile, isLoading } = useProfile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useActivePath();
  usePreferences(profile?.theme, profile?.reduce_motion);

  const level = useMemo(() => xpLevel(profile?.xp ?? 0), [profile?.xp]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="p-3">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border p-3">
          {isLoading ? (
            <Skeleton className="h-14 w-full rounded-xl" />
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/60"
            >
              <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-lg">
                {profile?.avatar_emoji ?? "🦊"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{profile?.display_name}</span>
                <span className="block text-xs text-muted-foreground">
                  Lv {level.level} · {level.title}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-3">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <div className="mt-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Brand />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
              aria-label="Search lessons, words and grammar"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded bg-muted px-1.5 text-[0.65rem] font-medium md:inline">⌘K</kbd>
            </Button>
            <span className="flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning-foreground">
              <Flame className="size-3.5" aria-hidden />
              {profile?.streak_count ?? 0}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
              <Zap className="size-3.5" aria-hidden />
              {profile?.xp ?? 0}
            </span>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.68rem] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
