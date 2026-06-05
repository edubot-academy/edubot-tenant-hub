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
  Building2,
  Plug,
  Shield,
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
      { key: "classes", labelKey: "nav.classes", icon: BookOpen, to: "/" },
      { key: "quizBank", labelKey: "nav.quizBank", icon: Library, to: "/" },
      { key: "marketplace", labelKey: "nav.marketplace", icon: Store, to: "/" },
    ],
  },
  student: {
    surface: "playful",
    home: "/student",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/student" },
      { key: "myCourses", labelKey: "nav.myCourses", icon: BookOpen, to: "/student" },
      { key: "quizzes", labelKey: "nav.quizzes", icon: Library, to: "/student" },
      { key: "achievements", labelKey: "nav.achievements", icon: Trophy, to: "/student" },
      { key: "leaderboard", labelKey: "nav.leaderboard", icon: GraduationCap, to: "/student" },
    ],
  },
  parent: {
    surface: "playful",
    home: "/parent",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/parent" },
      { key: "children", labelKey: "nav.children", icon: Users, to: "/parent" },
      { key: "schedule", labelKey: "nav.schedule", icon: Calendar, to: "/parent" },
      { key: "messages", labelKey: "nav.messages", icon: MessageSquare, to: "/parent" },
      { key: "billing", labelKey: "nav.billing", icon: CreditCard, to: "/parent" },
    ],
  },
  assistant: {
    surface: "ops",
    home: "/assistant",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/assistant" },
      { key: "grading", labelKey: "nav.grading", icon: ClipboardCheck, to: "/assistant" },
      { key: "discussions", labelKey: "nav.discussions", icon: MessageSquare, to: "/assistant" },
      { key: "reports", labelKey: "nav.reports", icon: BarChart3, to: "/assistant" },
    ],
  },
  company_admin: {
    surface: "ops",
    home: "/admin",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/admin" },
      { key: "users", labelKey: "nav.users", icon: Users, to: "/admin" },
      { key: "courses", labelKey: "nav.courses", icon: BookOpen, to: "/admin" },
      { key: "reports", labelKey: "nav.reports", icon: BarChart3, to: "/admin" },
      { key: "integrations", labelKey: "nav.integrations", icon: Plug, to: "/admin" },
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
  if (pathname === "/") return "instructor";
  return null;
}
