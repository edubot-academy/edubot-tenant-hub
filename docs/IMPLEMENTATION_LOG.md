# Implementation Log

This document tracks completed implementation tasks for the tenant frontend backend alignment work.

## 2026-06-06 — Backend-Controlled Roles, Tenant Branding, Workspace Switching, Route Guards

### Completed

- Backend-controlled role authority:
  - `src/lib/roles.tsx` now derives the active role from `AppContext.activeRole` in backend mode.
  - `questlms.role` localStorage is only used in prototype mode.
  - Route path changes no longer mutate active role in backend mode.

- Tenant branding:
  - `src/components/auth/AuthShell.tsx` uses `AppContext.activeTenant` branding.
  - Login/auth shell displays tenant name, tenant logo URL when available, tenant logo text fallback, and tenant brand color.
  - Root and instructor dashboard metadata no longer use the old QuestLMS brand.

- Workspace switching:
  - Added `src/components/dashboard/WorkspaceSwitcher.tsx`.
  - Backend mode uses `context.workspaces` to show tenant workspaces.
  - Workspace switch saves active company id through `tenantStore`.
  - Workspace switch calls `POST /companies/workspaces/switch` when available, then refetches `app-context`.
  - After switching, the user is navigated to the selected workspace role home route.
  - Prototype mode keeps manual role switching for design review.

- Route access guard:
  - Added `src/lib/route-access.ts` with public route and role-prefix rules.
  - Added `src/components/auth/AccessDenied.tsx`.
  - Root route now wraps protected app content with `RouteAccessGate`.
  - Backend mode shows access denied when a user opens a route outside their active backend role.
  - Prototype mode is not strictly guarded.

- Sidebar filtering:
  - `src/components/dashboard/Sidebar.tsx` filters nav items with `canAccessRoute()` in backend mode.
  - Users no longer see nav links that their backend-active role cannot open.

### Backend Compatibility Used

- `GET /auth/profile`
- `GET /companies/workspaces`
- `POST /companies/workspaces/switch`
- `GET /tenant-context/resolve?host=<host-or-slug>`

### Known Follow-ups

- Add a consolidated `GET /me/context` backend endpoint when ready.
- Replace static dashboard cards with role-specific backend dashboard endpoints.
- Add deeper permission-based filtering for actions inside pages, not only route/sidebar visibility.
- Wire forgot/reset password UI to backend endpoints.
- Run local/CI `npm run build` before merge.
