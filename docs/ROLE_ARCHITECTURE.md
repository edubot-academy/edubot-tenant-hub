# Role Architecture — Tenant Hub

## Two platforms, one backend

The backend is shared between two separate frontends:

| Platform | Purpose | Valid roles |
|---|---|---|
| **Main platform** (admin UI) | Manages tenants, billing, platform-level users | `superadmin`, `admin`, `instructor`, `student`, `assistant`, `parent` |
| **Tenant Hub** (this app) | Learning experience for a single tenant's users | `owner`, `company_admin`, `assistant`, `instructor`, `student`, `parent` |

**Main-platform users have no automatic access to any tenant.** A `superadmin` or `admin`
can only enter a tenant workspace if they are explicitly added to that company's member
list with an assigned tenant role. The backend enforces this — a main-platform role
(`admin`, `superadmin`) will never appear in a tenant `WorkspaceListItem.role` for a
legitimately provisioned user.

---

## Tenant Hub roles

| Role | Description | Equivalent in main platform |
|---|---|---|
| `owner` | Full tenant control — same as company_admin plus billing/branding | `superadmin` |
| `company_admin` | Manages staff, courses, settings | `admin` |
| `assistant` | Grading/support duties | `assistant` |
| `instructor` | Teaches assigned groups | `instructor` |
| `student` | Enrolled learner | `student` |
| `parent` | Guardian view for their child's progress | `parent` |

### `normalizeRole` in `app-context.tsx`

`normalizeRole` accepts the raw `role` string from a workspace record and returns a valid
`Role`. If the value is already a known tenant role it is returned as-is. Any other string
— including `superadmin` and `admin` — produces a console warning and falls back to
`"student"`.

This is intentional: main-platform roles must never appear in a tenant workspace record
for a legitimately provisioned user. If one does appear it signals a data problem on the
backend, so a safe (lowest-privilege) fallback is correct.

The valid role set is enforced at compile time via:

```ts
const KNOWN_TENANT_ROLES: Record<Role, true> = { owner, company_admin, ... };
```

If a new role is added to the `Role` union in `roles.tsx` without updating this object,
TypeScript reports an error.

---

## AppWorkspace vs AppContext roles

`AppWorkspace.role` is typed `Role | "admin" | "superadmin"` because workspace list items
from the backend can carry main-platform roles. These are the **raw backend values**.

`AppContext.activeRole` is always `Role` — `normalizeRole()` is applied before it is set.
All routing, gating, and UI rendering uses `activeRole`, never the raw workspace role.

---

## Feature flags & permissions (pre-login)

Before the user authenticates, `fetchPublicTenantContext` calls `/tenant-context/resolve`
to obtain the tenant's branding and feature flags. The resolved tenant's `featureFlags`
object is passed through to the context so that pre-login pages (e.g. the sign-in page
showing a "Parent login" tab) can respect the tenant's feature configuration.

Permissions are always empty pre-login (`permissions: []`). Access-gated routes will
redirect to the login page.

---

## Auth mode notes

| Mode | How context is loaded |
|---|---|
| **Token** (`VITE_AUTH_SESSION_MODE` unset) | `tokenStore` → `fetchCompatibilityAppContext` |
| **Cookie** (`VITE_AUTH_SESSION_MODE=cookie`) | `fetchCompatibilityAppContext` (cookie sent automatically); on 401 or any server error falls through to `fetchPublicTenantContext` so the login page is always shown |
| **Prototype** (no `VITE_API_BASE_URL`) | `PROTOTYPE_CONTEXT` used — only for local development without a backend |

`PROTOTYPE_CONTEXT` is **never** served when the backend is enabled.

---

## Where to touch when adding a new role

1. Add the value to the `Role` union in [src/lib/roles.tsx](../src/lib/roles.tsx)
2. Update `KNOWN_TENANT_ROLES` in [src/lib/app-context.tsx](../src/lib/app-context.tsx) — TypeScript will error here if you forget
3. Add a `ROLE_CONFIG` entry in `roles.tsx`
4. Update `roleFromPath` in `roles.tsx` if the new role has a URL namespace
5. Update `normalizeRole` if the backend can also return a main-platform alias for this role
6. Update `ROLE_ACCESS_RULES` in [src/lib/route-access.ts](../src/lib/route-access.ts) to grant/restrict routes
