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
  Award,
  Zap,
  Megaphone,
  Trophy,
  Calendar,
  MessageSquare,
  ClipboardCheck,
  Plug,
  Bell,
  Sparkles,
  Wand2,
  Bot,
  User,
  Palette,
  ToggleLeft,
  type LucideIcon,
} from "lucide-react";

import { useAppContext } from "@/lib/app-context";

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

const COMPANY_ADMIN_NAV: NavItem[] = [
  { key: "home", labelKey: "nav.home", icon: Home, to: "/" },
  { key: "staff", labelKey: "nav.staff", icon: Users, to: "/company-admin/staff" },
  { key: "courses", labelKey: "nav.courses", icon: BookOpen, to: "/courses" },
  { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/settings" },
];

const OWNER_NAV: NavItem[] = [
  { key: "home", labelKey: "nav.home", icon: Home, to: "/" },
  { key: "staff", labelKey: "nav.staff", icon: Users, to: "/company-admin/staff" },
  { key: "courses", labelKey: "nav.courses", icon: BookOpen, to: "/courses" },
  { key: "billing", labelKey: "nav.billing", icon: CreditCard, to: "/company-admin/billing" },
  { key: "integrations", labelKey: "nav.integrations", icon: Plug, to: "/company-admin/integrations" },
  { key: "branding", labelKey: "nav.branding", icon: Palette, to: "/company-admin/branding" },
  { key: "features", labelKey: "nav.features", icon: ToggleLeft, to: "/company-admin/features" },
  { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/settings" },
];

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  instructor: {
    surface: "playful",
    home: "/",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/" },
      { key: "classes", labelKey: "nav.classes", icon: BookOpen, to: "/classes" },
      { key: "students", labelKey: "nav.students", icon: Users, to: "/instructor/students" },
      { key: "studio", labelKey: "nav.studio", icon: Sparkles, to: "/course-studio" },
      { key: "assignments", labelKey: "nav.assignments", icon: ClipboardCheck, to: "/instructor/assignments" },
      { key: "grading", labelKey: "nav.grading", icon: ClipboardCheck, to: "/grading" },
      { key: "quizBank", labelKey: "nav.quizBank", icon: Library, to: "/quiz-bank" },
      { key: "liveQuizHost", labelKey: "nav.liveQuizHost", icon: Zap, to: "/live-quiz-host" },
      { key: "aiGenerator", labelKey: "nav.aiGenerator", icon: Wand2, to: "/ai-generator" },
      { key: "aiGrading", labelKey: "nav.aiGrading", icon: Bot, to: "/ai-grading" },
      { key: "discussions", labelKey: "nav.discussions", icon: MessageSquare, to: "/instructor/discussions" },
      { key: "messages", labelKey: "nav.messages", icon: MessageSquare, to: "/instructor/messages" },
      { key: "announcements", labelKey: "nav.announcements", icon: Megaphone, to: "/instructor/announcements" },
      { key: "officeHours", labelKey: "nav.officeHours", icon: Calendar, to: "/instructor/office-hours" },
      { key: "calendar", labelKey: "nav.calendar", icon: Calendar, to: "/calendar" },
      { key: "analytics", labelKey: "nav.analytics", icon: BarChart3, to: "/instructor/analytics" },
      { key: "marketplace", labelKey: "nav.marketplace", icon: Store, to: "/marketplace" },
      { key: "profile", labelKey: "nav.profile", icon: User, to: "/instructor/profile" },
      { key: "notifications", labelKey: "nav.notifications", icon: Bell, to: "/notifications" },
      { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/settings" },
    ],
  },
  student: {
    surface: "playful",
    home: "/",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/" },
      { key: "discover", labelKey: "nav.discover", icon: Store, to: "/discover" },
      { key: "myCourses", labelKey: "nav.myCourses", icon: BookOpen, to: "/student/courses" },
      { key: "quizzes", labelKey: "nav.quizzes", icon: Library, to: "/student/quizzes" },
      { key: "submissions", labelKey: "nav.submissions", icon: ClipboardCheck, to: "/student/submissions" },
      { key: "notes", labelKey: "nav.notes", icon: BookOpen, to: "/student/notes" },
      { key: "messages", labelKey: "nav.messages", icon: MessageSquare, to: "/student/messages" },
      { key: "announcements", labelKey: "nav.announcements", icon: Megaphone, to: "/student/announcements" },
      { key: "discussions", labelKey: "nav.discussions", icon: MessageSquare, to: "/student/discussions" },
      { key: "aiTutor", labelKey: "nav.aiTutor", icon: Bot, to: "/ai-tutor" },
      { key: "studyPlan", labelKey: "nav.studyPlan", icon: Wand2, to: "/ai-study-plan" },
      { key: "xp", labelKey: "nav.xp", icon: Sparkles, to: "/xp" },
      { key: "leagues", labelKey: "nav.leagues", icon: Trophy, to: "/leagues" },
      { key: "badges", labelKey: "nav.badges", icon: GraduationCap, to: "/badges" },
      { key: "certificates", labelKey: "nav.certificates", icon: Award, to: "/student/certificates" },
      { key: "leaderboard", labelKey: "nav.leaderboard", icon: GraduationCap, to: "/student/leaderboard" },
      { key: "calendar", labelKey: "nav.calendar", icon: Calendar, to: "/calendar" },
      { key: "profile", labelKey: "nav.profile", icon: User, to: "/student/profile" },
      { key: "notifications", labelKey: "nav.notifications", icon: Bell, to: "/notifications" },
      { key: "settings", labelKey: "nav.settings", icon: Settings, to: "/settings" },
    ],
  },
  parent: {
    surface: "playful",
    home: "/",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/" },
      { key: "children", labelKey: "nav.children", icon: Users, to: "/parent/children" },
      { key: "schedule", labelKey: "nav.schedule", icon: Calendar, to: "/parent/schedule" },
      { key: "messages", labelKey: "nav.messages", icon: MessageSquare, to: "/parent/messages" },
      { key: "billing", labelKey: "nav.billing", icon: CreditCard, to: "/parent/billing" },
    ],
  },
  assistant: {
    surface: "ops",
    home: "/",
    nav: [
      { key: "home", labelKey: "nav.home", icon: Home, to: "/" },
      { key: "grading", labelKey: "nav.grading", icon: ClipboardCheck, to: "/assistant/grading" },
      { key: "discussions", labelKey: "nav.discussions", icon: MessageSquare, to: "/assistant/discussions" },
      { key: "reports", labelKey: "nav.reports", icon: BarChart3, to: "/assistant/reports" },
    ],
  },
  company_admin: {
    surface: "ops",
    home: "/",
    nav: COMPANY_ADMIN_NAV,
  },
  owner: {
    surface: "ops",
    home: "/",
    nav: OWNER_NAV,
  },
};

const STORAGE_KEY = "questlms.role";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  config: RoleConfig;
  isBackendControlled: boolean;
}

const RoleContext = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { context, isBackendEnabled } = useAppContext();
  const isBackendControlled = isBackendEnabled && context.mode === "backend";
  const [prototypeRole, setPrototypeRole] = useState<Role>("instructor");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isBackendControlled) return;
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored && ALL_ROLES.includes(stored)) setPrototypeRole(stored);
    setHydrated(true);
  }, [isBackendControlled]);

  useEffect(() => {
    if (!isBackendControlled && hydrated && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, prototypeRole);
    }
  }, [prototypeRole, hydrated, isBackendControlled]);

  const role = isBackendControlled ? context.activeRole : prototypeRole;

  const config = useMemo<RoleConfig>(() => {
    const baseConfig = ROLE_CONFIG[role];
    const tenantModel = context.activeTenant.tenantModel;

    if (role === "student" && tenantModel === "academic") {
      return {
        ...baseConfig,
        nav: baseConfig.nav.map((item) =>
          item.key === "myCourses"
            ? { ...item, key: "classes", labelKey: "nav.classes", to: "/student/classes" }
            : item,
        ),
      };
    }

    if (role === "instructor" && tenantModel === "course_center") {
      return {
        ...baseConfig,
        nav: baseConfig.nav.map((item) =>
          item.key === "classes" ? { ...item, labelKey: "nav.groups" } : item,
        ),
      };
    }

    if (role === "instructor" && tenantModel === "academic") {
      // In academic mode: promote schedule/classes, demote studio to after analytics
      const studioItem = baseConfig.nav.find((item) => item.key === "studio");
      const withoutStudio = baseConfig.nav.filter((item) => item.key !== "studio");
      const analyticsIdx = withoutStudio.findIndex((item) => item.key === "analytics");
      const reordered =
        studioItem && analyticsIdx !== -1
          ? [
              ...withoutStudio.slice(0, analyticsIdx + 1),
              studioItem,
              ...withoutStudio.slice(analyticsIdx + 1),
            ]
          : baseConfig.nav;
      return { ...baseConfig, nav: reordered };
    }

    return baseConfig;
  }, [role, context.activeTenant.tenantModel]);

  const value = useMemo<RoleCtx>(
    () => ({
      role,
      setRole: (nextRole) => {
        if (!isBackendControlled) setPrototypeRole(nextRole);
      },
      config,
      isBackendControlled,
    }),
    [role, isBackendControlled, config],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}

/** Infer the role that matches a URL path, used only in prototype mode to keep the sidebar in sync. */
export function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/parent")) return "parent";
  if (pathname.startsWith("/assistant")) return "assistant";
  if (pathname.startsWith("/company-admin") || pathname.startsWith("/admin") || pathname.startsWith("/owner")) return "company_admin";
  if (
    pathname.startsWith("/classes") ||
    pathname.startsWith("/quiz-bank") ||
    pathname.startsWith("/marketplace")
  ) {
    return "instructor";
  }
  return null;
}
