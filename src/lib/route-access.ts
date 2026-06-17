import { ROLE_CONFIG, type Role } from "@/lib/roles";

export const PUBLIC_ROUTE_PREFIXES = [
  "/auth",
  "/invite",
  "/reset-password",
  "/live-quiz-join",
  "/setup-account",
];

const ROLE_ACCESS_RULES: Array<{ prefixes: string[]; roles: Role[] }> = [
  { prefixes: ["/billing", "/branding", "/integrations", "/features"], roles: ["owner"] },
  { prefixes: ["/trial-requests"], roles: ["owner", "company_admin", "instructor"] },
  { prefixes: ["/live-quiz-host"], roles: ["instructor", "company_admin", "owner"] },
  { prefixes: ["/students"], roles: ["company_admin", "owner"] },
  { prefixes: ["/company-admin", "/admin", "/staff", "/hierarchy"], roles: ["company_admin", "owner"] },
  { prefixes: ["/instructor", "/course-studio", "/classes", "/courses", "/groups"], roles: ["instructor", "company_admin", "owner"] },
  { prefixes: ["/discover", "/ai-tutor", "/ai-study-plan", "/xp", "/leagues", "/badges"], roles: ["student", "owner"] },
  { prefixes: ["/calendar", "/notifications", "/settings"], roles: ["owner", "company_admin", "assistant", "instructor", "student", "parent"] },
  { prefixes: ["/ai-generator", "/ai-grading"], roles: ["instructor", "assistant", "company_admin", "owner"] },
  { prefixes: ["/course-player", "/quiz-results"], roles: ["student", "instructor", "company_admin", "owner"] },
  { prefixes: ["/marketplace"], roles: ["instructor", "company_admin", "owner"] },
  { prefixes: ["/onboarding"], roles: ["owner", "company_admin"] },
  { prefixes: ["/quiz-bank"], roles: ["instructor", "company_admin", "owner"] },
  { prefixes: ["/assistant"], roles: ["assistant", "company_admin", "owner"] },
  { prefixes: ["/grading"], roles: ["instructor", "assistant", "company_admin", "owner"] },
  { prefixes: ["/student"], roles: ["student", "owner"] },
  { prefixes: ["/parent"], roles: ["parent", "owner"] },
  { prefixes: ["/owner"], roles: ["owner"] },
  { prefixes: ["/"], roles: ["instructor", "student", "parent", "assistant", "company_admin", "owner"] },
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function canAccessRoute(pathname: string, role: Role) {
  if (isPublicRoute(pathname)) return true;
  const rule = ROLE_ACCESS_RULES.find(({ prefixes }) =>
    prefixes.some((prefix) => matchesPrefix(pathname, prefix)),
  );
  return rule ? rule.roles.includes(role) : false;
}

export function homeForRole(role: Role) {
  return ROLE_CONFIG[role].home;
}
