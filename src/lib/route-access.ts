import { ROLE_CONFIG, type Role } from "@/lib/roles";

export const PUBLIC_ROUTE_PREFIXES = [
  "/auth",
  "/invite",
  "/reset-password",
  "/live-quiz-join",
];

const ROLE_ACCESS_RULES: Array<{ prefixes: string[]; roles: Role[] }> = [
  { prefixes: ["/admin"], roles: ["company_admin", "owner"] },
  { prefixes: ["/owner"], roles: ["owner"] },
  { prefixes: ["/assistant"], roles: ["assistant", "company_admin", "owner"] },
  { prefixes: ["/student"], roles: ["student"] },
  { prefixes: ["/parent"], roles: ["parent"] },
  { prefixes: ["/instructor", "/course-studio", "/classes"], roles: ["instructor", "company_admin", "owner"] },
  { prefixes: ["/grading"], roles: ["instructor", "assistant", "company_admin", "owner"] },
  { prefixes: ["/quiz-bank", "/live-quiz-host"], roles: ["instructor", "company_admin", "owner"] },
  { prefixes: ["/ai-generator", "/ai-grading"], roles: ["instructor", "assistant", "company_admin", "owner"] },
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
  return rule ? rule.roles.includes(role) : true;
}

export function homeForRole(role: Role) {
  return ROLE_CONFIG[role].home;
}
