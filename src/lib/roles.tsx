import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Home,
  BookOpen,
  Library,
  Store,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  GraduationCap,
  Trophy,
  Calendar,
  MessageSquare,
  ClipboardCheck,
  Plug,
  Shield,
  Bell,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";


export type Role =
  | "owner"
  | "company_admin"
  | "assistant"
  | "instructor"
  | "student"
  | "parent";

export const ALL_ROLES: Role[] = [
  "owner",
  "company_admin",
  "assistant",
  "instructor",
  "student",
  "parent",
];

export type Surface = "playful" | "ops";

export interface NavItem {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  to: string;
}

export interface RoleConfig {
  surface: Surface;
  home: string;
  nav: NavItem[];
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  instructor: {
    surface: "playful",
    home: "/",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/" },
      { key: "classes", labelKey: "nav.classes", icon: BookOpen, to: "/classes" },
      { key: "studio", labelKey: "nav.studio", icon: Sparkles, to: "/course-studio" },
      { key: "quizBank", labelKey: "nav.quizBank", icon: Library, to: "/quiz-bank" },
      { key: "calendar", labelKey: "nav.calendar", icon: Calendar, to: "/calendar" },
      { key: "marketplace", labelKey: "nav.marketplace", icon: Store, to: "/marketplace" },
      { key: "notifications", labelKey: "nav.notifications", icon: Bell, to: "/notifications" },
      { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/settings" },
    ],
  },
  student: {
    surface: "playful",
    home: "/student",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/student" },
      { key: "myCourses", labelKey: "nav.myCourses", icon: BookOpen, to: "/student/courses" },
      { key: "quizzes", labelKey: "nav.quizzes", icon: Library, to: "/student/quizzes" },
      { key: "achievements", labelKey: "nav.achievements", icon: Trophy, to: "/student/achievements" },
      { key: "leaderboard", labelKey: "nav.leaderboard", icon: GraduationCap, to: "/student/leaderboard" },
      { key: "calendar", labelKey: "nav.calendar", icon: Calendar, to: "/calendar" },
      { key: "profile", labelKey: "nav.profile", icon: User, to: "/student/profile" },
      { key: "notifications", labelKey: "nav.notifications", icon: Bell, to: "/notifications" },
      { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/settings" },
    ],
  },

  parent: {
    surface: "playful",
    home: "/parent",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/parent" },
      { key: "children", labelKey: "nav.children", icon: Users, to: "/parent/children" },
      { key: "schedule", labelKey: "nav.schedule", icon: Calendar, to: "/parent/schedule" },
      { key: "messages", labelKey: "nav.messages", icon: MessageSquare, to: "/parent/messages" },
      { key: "billing", labelKey: "nav.billing", icon: CreditCard, to: "/parent/billing" },
    ],
  },
  assistant: {
    surface: "ops",
    home: "/assistant",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/assistant" },
      { key: "grading", labelKey: "nav.grading", icon: ClipboardCheck, to: "/assistant/grading" },
      { key: "discussions", labelKey: "nav.discussions", icon: MessageSquare, to: "/assistant/discussions" },
      { key: "reports", labelKey: "nav.reports", icon: BarChart3, to: "/assistant/reports" },
    ],
  },
  company_admin: {
    surface: "ops",
    home: "/admin",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/admin" },
      { key: "staff", labelKey: "nav.staff", icon: Users, to: "/admin/staff" },
      { key: "courses", labelKey: "nav.courses", icon: BookOpen, to: "/admin" },
      { key: "reports", labelKey: "nav.reports", icon: BarChart3, to: "/admin" },
      { key: "billing", labelKey: "nav.billing", icon: CreditCard, to: "/admin/billing" },
      { key: "integrations", labelKey: "nav.integrations", icon: Plug, to: "/admin/integrations" },
      { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/admin" },
    ],
  },
  owner: {
    surface: "ops",
    home: "/owner",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/owner" },
      { key: "billing", labelKey: "nav.billing", icon: CreditCard, to: "/owner" },
      { key: "analytics", labelKey: "nav.analytics", icon: BarChart3, to: "/owner" },
      { key: "audit", labelKey: "nav.audit", icon: Shield, to: "/owner" },
      { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/owner" },
    ],
  },
};

const STORAGE_KEY = "questlms.role";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  config: RoleConfig;
}

const RoleContext = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  // Stable default for SSR + initial client render to avoid hydration mismatch.
  const [role, setRoleState] = useState<Role>("instructor");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored && ALL_ROLES.includes(stored)) setRoleState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, role);
    }
  }, [role, hydrated]);

  const value = useMemo<RoleCtx>(
    () => ({ role, setRole: setRoleState, config: ROLE_CONFIG[role] }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}

/** Infer the role that matches a URL path, used to keep the sidebar in sync when navigating by URL. */
export function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/parent")) return "parent";
  if (pathname.startsWith("/assistant")) return "assistant";
  if (pathname.startsWith("/admin")) return "company_admin";
  if (pathname.startsWith("/owner")) return "owner";
  if (
    pathname === "/" ||
    pathname.startsWith("/classes") ||
    pathname.startsWith("/quiz-bank") ||
    pathname.startsWith("/marketplace")
  ) {
    return "instructor";
  }
  return null;
}
