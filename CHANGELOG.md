# Changelog

All notable frontend changes should be recorded in this file.

This project follows SemVer-style versioning for app releases, even though it is private:

- `MAJOR` version: user-facing or backend-contract changes that require coordinated backend migration, data migration, route migration, or tenant rollout planning.
- `MINOR` version: new user-facing features, new backend integrations, new routes, new app contexts, or meaningful UI/workflow additions that are backward compatible.
- `PATCH` version: bug fixes, copy changes, styling fixes, small endpoint compatibility fixes, dependency fixes, and non-breaking internal cleanup.

Version numbers live in `package.json` and `package-lock.json`. Every release PR should update both the package version and this changelog entry together.

## Changelog Rules

- Keep an `Unreleased` section at the top for work merged after the last version.
- Move `Unreleased` items into a numbered version section when cutting a release.
- Use ISO dates: `YYYY-MM-DD`.
- Group entries under: `Added`, `Changed`, `Fixed`, `Removed`, `Security`, when relevant.
- Mention backend contract changes explicitly, including endpoint names and whether they are required or optional.
- Mention Lovable compatibility risks explicitly when dependency, routing, build, or TanStack Start config changes are made.
- Do not record generated build output, lockfile-only churn, or formatting-only edits unless they affect runtime behavior.

## [Unreleased]

### Added

#### Feature Flags

- `featureFlag` field on `NavItem` type; sidebar now filters nav items against `context.featureFlags` so feature-flagged items are hidden automatically without backend route access changes.
- `canAccessFeature(pathname, featureFlags)` in `route-access.ts`; root `RouteAccessGate` redirects to `/` when a route's feature flag is disabled, closing the gap between sidebar gating and direct URL access.
- `useFeatureFlag(flag)` convenience hook exported from `app-context.tsx`.
- AI feature flag (`ai`) wired to: sidebar items (`studio`, `aiGenerator`, `aiGrading`, `aiTutor`, `studyPlan`), course studio AI sidebar panel and redirect guard, live quiz host AI tab and source-tab selector, course player AI tutor link, quick actions "Create Lesson" card, overview active-classes "create first course" shortcut, student dashboard AI tutor card, billing page AI credits stat, and billing usage AI credits bar.

#### Tenant Theming

- `secondaryColor` and `accentColor` fields added to `AppContextTenant`; resolved from `workspace.branding.secondaryColor` / `accentColor` with sensible defaults; prototype and no-workspace stubs updated.
- `BrandingHeadSync` now applies all three brand colors to `--tenant-primary-source`, `--tenant-secondary-source`, and `--tenant-accent-source` CSS custom properties via `upsertBrandColors`; skips updates while `isLoading` is true to prevent a flash between placeholder values and the real tenant brand.
- 3-hex shorthand color normalization in `sanitizeColor` (e.g. `#abc` → `#aabbcc`).
- Brand color localStorage cache (`tenant-brand-cache`) keyed by hostname with a 30-minute TTL; lets the early-brand script reinstate colors on the next page load before React hydrates.
- Early-brand inline script injected into `<head>` before any CSS: reads the cache and sets the three CSS source variables synchronously, preventing any color flash on subsequent loads.
- Early dark-mode script injected into `<head>` to apply `.dark` class before first paint, preventing a light→dark flash on preferred-color-scheme dark.
- `styles.css` refactored: `--primary`, `--secondary`, `--accent`, `--ring`, `--streak`, shadow tokens, and gradient tokens now read from the three `--tenant-*-source` variables; `@supports (color: color-mix(...))` block adds dark-mode tint adjustments and computed shadow/gradient values for browsers that support it.

#### App Context

- `refetch()` called after successful branding save on `/branding` and after completing the `organization` and `branding` onboarding steps, so the sidebar and head sync immediately reflect the updated tenant name and colors.

#### Groups

- Group list route (`/groups`) with group cards and inline create dialog.
- Group detail route (`/groups/:groupId`) with `GroupDetailView` component: member roster, schedule, session history, and group-level stats tabs.
- Group session detail route (`/groups/:groupId/sessions/:sessionId`) mirroring the class session detail structure.
- `IndividualGroupDialog` and `CreateGroupDialog` components for creating and editing groups.
- LMS core API extended with group creation types, makeup session fields, and activity payload types.

#### Student Workspace

- Vocabulary spaced-repetition review route (`/student/vocab-review`) with spaced-repetition hooks in `student-portal-api`.
- Student access state hook (`useStudentAccess`) and dashboard stats/session/homework/feedback/progress types added to `student-portal-api`.
- `useStudentPortalDashboard`, `useStudentSupportOptions`, and `useSubmitActivityQuiz` hooks.

#### Instructor Workspace

- Group messages route (`/instructor/group-messages`) for broadcasting to enrolled groups.

#### Parent Workspace

- Group chat route (`/parent/group-chat/:groupId`) for real-time group communication.
- Localized parent messages page (`/parent/messages`).

#### Company Admin / Owner Workspace

- Standalone students list route (`/students`) and student detail route (`/students/:studentId`), accessible by `company_admin` and `owner`.
- Trial requests management route (`/trial-requests`), accessible by `instructor`, `company_admin`, and `owner`.

#### Navigation

- `vocabReview` nav item added to student sidebar.
- `groupMessages` and `trialRequests` nav items added to instructor sidebar.
- `students` and `trialRequests` nav items added to `company_admin` and `owner` sidebars.
- TopBar search button with ⌘K hint.

#### Docs

- `docs/ROLE_ARCHITECTURE.md` describing the full role system, access tiers, and `normalizeRole` logic.
- `docs/ROLES_AND_FLOWS.md` with role-by-role navigation maps and API flow diagrams.

### Changed

#### Route Restructuring — Breaking URL Change

- All `company-admin/*` routes promoted to top-level role-agnostic paths: `/billing`, `/branding`, `/features`, `/hierarchy`, `/integrations`, `/staff`, `/staff/:userId`. The previous `/company-admin/*` URLs no longer exist. **Requires coordinated backend redirect or tenant rollout if deep links are bookmarked.**
- Route access rules tightened: `owner`-only pages (`/billing`, `/branding`, `/integrations`, `/features`, `/owner/*`) are no longer reachable by `company_admin`.
- `KNOWN_TENANT_ROLES` compile-time completeness guard added to `roles.tsx` to catch Role type drift.

#### Localization

- Billing i18n keys renamed from `companyAdminBillingPage.*` to `billingPage.*` across EN/RU/KY. Any external key references must be updated.
- EN/RU/KY locales updated for all new and renamed routes.

#### UI

- `TenantBadge` refactored into a `TenantLogo` sub-component for reuse across nav contexts.

### Fixed

- **AI route guard**: `/course-studio`, `/ai-generator`, `/ai-grading`, `/ai-tutor`, and `/ai-study-plan` now redirect to `/` when the `ai` feature flag is disabled, rather than rendering a broken or empty page.
- **`correctIndex` type**: `RevealView` in the live quiz host now accepts `correctIndex: number | undefined` (was `number`), matching the actual backend payload where the field may be absent.
- **Live quiz AI tab reset**: switching `ai` feature flag off while the AI source tab is active now falls back to the `manual` tab automatically.
- **Branding flash**: `BrandingHeadSync` no longer applies placeholder brand values while the app context is still loading, eliminating the visible color swap on first render.

- **Role authority**: separated `owner` and `company_admin` nav configs so admin users cannot reach owner-only pages.
- **CSRF**: added in-memory token fallback for token returned in response body; prevented false positives on legitimate auth 403 responses that contain CSRF error text.
- **Auth 401 deduplication**: `AUTH_EXPIRED_EVENT` now fires at most once per expiry cycle to prevent duplicate logout toasts and race conditions.
- **Billing retries**: `billingRetry` policy introduced to skip exponential back-off on 4xx billing errors.
- **Null guards**: `companyId` null-checked before all staff and billing mutation requests.
- **Prototype context leak**: `fetchPublicTenantContext` no longer falls through to prototype mock data when no backend tenant is resolved; uses a minimal stub instead.
- **Name fallback**: use `??` over `||` for tenant name fallback to avoid replacing an intentionally empty-string branding value.
- **Parent role**: added `parent` to staff invite form role options and `staff-api` type union.
- **Shared logout**: extracted `useLogout` hook; removed duplicate logout logic from `Sidebar` and `NoWorkspaceAccess`.
- **`/setup-account`** added to the public route allowlist so unauthenticated users are not bounced before completing setup.

## [1.0.0] - 2026-06-17

First complete release of the Edubot tenant hub. Covers the full multi-role LMS frontend: auth, five role workspaces, groups, gamification, backend integration, and full EN/RU/KY localization across every route.

### Added

#### Auth & Onboarding

- Backend auth flow: sign-in, logout, forgot-password, reset-password, invite acceptance, setup-account, and account activation routes, each wired to the backend with localized copy in all three languages.
- App API client with authenticated requests, tenant headers, CSRF token retry, auth-expired event dispatch, and token/tenant storage.
- Root-level authenticated route guard that fails closed for unknown protected routes and allows only explicitly listed public routes (auth, invite, reset-password, live quiz join).
- Access denied screen shown when a role attempts to reach a route outside its access tier, with localized copy.
- No-workspace access screen for authenticated users who do not belong to any tenant workspace.
- Onboarding wizard route with localized shell and step copy.

#### Student Workspace

- Course list, course detail, and course player routes wired to backend.
- Class list and class detail routes with session drill-down.
- Quiz list, quiz results, and submission history routes.
- Assignments, announcements, discussions, and messages routes.
- Notes, discover, AI study plan, and AI tutor routes; AI tutor auto-selects when only one course is enrolled.
- Vocabulary review route (`/student/vocab-review`).
- Leaderboard, XP progress, badges, leagues, achievements, and certificates routes.
- Student profile route.
- Student enrollment UI with role-aligned type definitions matching the backend enrollment contract.

#### Instructor Workspace

- Analytics, announcements, assignments, discussions, messages, and office hours routes.
- Student list and student detail routes wired to backend profile data.
- Instructor profile route wired to backend with API hooks for read and update.
- Quiz bank, assignment grading, course studio, and live quiz host routes.
- AI content generator and AI grading assistant routes.
- Group messages route (`/instructor/group-messages`).
- Calendar and notifications routes.

#### Assistant Workspace

- Overview dashboard with localized operation and action labels.
- Grading queue and reports routes.
- Support queue with mutation guards to prevent concurrent conflicting actions.

#### Parent Workspace

- Overview dashboard with localized copy.
- Schedule, children, billing, and messages routes.
- Group chat route per group (`/parent/group-chat/:groupId`).

#### Company-Admin Workspace

- Staff list and member profile routes, backed by staff API.
- Billing route wired to tenant billing APIs (invoice ledger, billing dates, plan details).
- Branding, features, integrations, and organization hierarchy routes.
- API keys and audit log views with localized sample data.
- Admin report charts with localized labels and locale-aware date formatting.
- Activity feed with localized activity key labels.

#### Groups

- Group list (`/groups`), group detail (`/groups/:groupId`), and group session detail (`/groups/:groupId/sessions/:sessionId`) routes.
- `GroupDetailView` and `IndividualGroupDialog` components for group management.

#### Trial Requests

- Trial requests route (`/trial-requests`) for managing inbound trial applications.

#### Gamification

- Streak calendar on student overview with localized weekday labels.
- Badges, leagues, XP progress bar, and leaderboard routes with full localization.
- Achievement and certificate routes.

#### Tenant Infrastructure

- App context provider resolving tenant, active role, user profile, workspaces, permissions, and feature flags from the backend.
- Tenant-aware sidebar and mobile drawer branding: tenant name, logo image, logo text, and brand color.
- Backend-driven head sync: document title, favicon, and meta tags updated from resolved tenant context on every navigation.
- Query-param tenant resolution for local development (`?tenant=<slug>`, `?tenantId=<id>`).
- Optional `/me/context` integration behind `VITE_USE_APP_CONTEXT_ENDPOINT=true`.
- Optional cookie-backed session bootstrap via `VITE_AUTH_SESSION_MODE=cookie` or `VITE_USE_COOKIE_AUTH=true`.
- Workspace switcher in backend mode for users with multiple tenant memberships.
- Sidebar items filtered by backend route access rules per active role.

#### Routing & Navigation

- Home route (`/`) unified for all roles; post-login redirect resolves by active role from backend context.
- Role-based route access rules covering all current route prefixes with explicit allow-lists per role.
- Command palette with localized grouping labels and keyboard shortcut copy.

#### Localization (EN / RU / KY)

- Full three-language localization across every route and workspace: auth shell, onboarding, settings, sidebar, top bar, command palette, role switcher, and all role-scoped page copy.
- Locale provider with deep-merge branch resource loading; per-branch overrides do not clobber shared keys.
- Localized: auth forms, invite and activation flows, instructor workspace (analytics, assignments, announcements, discussions, messages, office hours, students, grading, quiz bank, course studio, live quiz, AI tools, profile), student workspace (courses, classes, quizzes, submissions, discussions, messages, leaderboard, notes, discover, AI study plan, AI tutor, badges, leagues, XP, vocab review, overview), assistant workspace (overview, grading, reports, support), parent workspace (overview, schedule, children, billing, messages), company-admin workspace (staff, billing, branding, features, integrations, hierarchy, reports, audit log, API keys), and shared routes (calendar, notifications, marketplace, settings).
- App name, metadata, and favicon no longer contain hardcoded `QuestLMS` defaults; all resolved from tenant context.

#### Docs

- `docs/ROLES_AND_FLOWS.md` documenting role authority model, workspace scoping, and navigation flows for all supported roles.

### Changed

- Role types across the frontend aligned with backend-canonical role identifiers; `normalizeRole` updated to handle all current and aliased role keys.
- Company-admin workspace routes restructured from `/company-admin/*` to role-agnostic top-level paths: `/billing`, `/branding`, `/features`, `/hierarchy`, `/integrations`, and `/staff`. All `company-admin.*` route files removed; `/admin` redirect now goes to `/` instead of `/company-admin`.
- Route access rules expanded: `/students`, `/staff`, `/hierarchy`, `/trial-requests`, and `/groups` registered with explicit per-role access tiers; `/setup-account` added to the public route allowlist so it no longer requires a session.
- `roleFromPath` extended to classify `/students`, `/staff`, `/billing`, `/branding`, `/integrations`, `/features`, and `/hierarchy` as `company_admin`-tier for sidebar and guard logic.
- Sidebar navigation updated: company-admin and owner nav items now link to restructured top-level paths; instructor nav gains `/instructor/group-messages` and `/trial-requests`; student nav gains `/student/vocab-review`; classes item in group context redirects to `/groups`.
- `lms-core-api.ts` extended with individual course-group creation types (`CreateIndividualCourseGroupInput`), makeup session fields, and activity payload types for vocabulary, fill-blank, word-match, and listening exercises.
- `student-portal-api.ts` extended with vocabulary spaced-repetition hooks: `useVocabDueCards` and `useRecordVocabReview` wired to `/vocabulary-reviews/due` and `/vocabulary-reviews/record`.
- `TenantBadge` refactored: shared `TenantLogo` sub-component extracted and reused in both full and compact (collapsed) sidebar states.
- `TopBar` adds a localized search button with `⌘K` keyboard shortcut hint linked to the command palette.
- Billing page i18n keys migrated from `companyAdminBillingPage.*` namespace to `billingPage.*` to match the route rename; `PaymentMethodCard` and `PlanComparison` updated accordingly.
- Company admin staff API updated to match current backend staff contract.
- Course catalog prototype renamed from "catalog" to "library" to align with product terminology.
- Tenant display reads from resolved app context instead of static tenant presets.
- First render without a token skips protected context, profile, and workspace API calls to avoid noise.
- Invite, activation, forgot-password, and reset-password pages no longer show fake successful outcomes in backend mode.
- Authenticated users without tenant membership now see the no-workspace screen instead of demo tenant fallback data.
- `?tenant=<slug>` only expands to a subdomain URL if `VITE_TENANT_QUERY_BASE_DOMAIN` is explicitly configured.
- `nitro` dev dependency aligned with `@lovable.dev/vite-tanstack-config` peer requirement.

### Fixed

- Role authority enforcement: sidebar filtering and route guards now fail closed for unknown or unregistered role values rather than defaulting to the broadest access tier.
- CSRF token refresh race condition resolved; concurrent requests that trigger a 403 share a single token refresh instead of racing with stale tokens.
- First-render 401 noise from `/auth/profile` and `/companies/workspaces` calls before login eliminated.
- CORS preflight failure caused by the custom `x-tenant-host` header removed from tenant resolution.
- Logout now completes locally and redirects even if the backend `/auth/logout` call fails.
- `/me/context` made opt-in behind an env flag to avoid local backend 404 noise until the endpoint is implemented.
- Raw i18n key strings no longer appear in assistant action labels or report views when a translation key is missing.
- Empty image `src` guard added to student course overview to prevent broken image requests.
- Parent schedule, billing, messages, and children pages use locale-aware date and label formatting throughout.

### Removed

- `src/routes/company-admin.billing.tsx`, `company-admin.branding.tsx`, `company-admin.features.tsx`, `company-admin.hierarchy.tsx`, `company-admin.integrations.tsx`, `company-admin.staff.tsx`, `company-admin.staff.index.tsx`, `company-admin.staff.$userId.tsx` — superseded by restructured top-level routes.

### Security

- Backend auth hardened: active role is derived exclusively from backend context; client-side role mutation from routes is blocked.
- Manual role switching UI hidden in backend mode to prevent out-of-band role escalation.
- Mock tenant fallback restricted to prototype mode only; backend mode no longer falls back to demo data.
- Route access fails closed for unknown or unregistered role values.
- CSRF token handling: concurrent 403 responses trigger exactly one token refresh, closing the window where stale tokens are retried in parallel.
- Ten security and correctness issues identified in code review addressed: auth guards, null guards on billing data, shared logout hook, and CSRF edge cases.
