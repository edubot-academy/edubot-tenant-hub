# Tenant Frontend Backend Alignment Plan

## Purpose

This document tracks the current alignment between the new `edubot-tenant-hub` frontend and the `edubot-learning-backend` APIs.

The frontend already contains the target UX for a tenant LMS, but many screens are still prototype-driven. The backend already has many matching domain modules, but some endpoints still need UI-ready view-model contracts.

## Priority Model

- **P0 - Foundation blocker:** Required before real tenant data can be used safely.
- **P1 - Core tenant LMS:** Required for a usable tenant product.
- **P2 - Role depth:** Required for each persona to feel production-ready.
- **P3 - Advanced product:** Differentiators such as AI, gamification, live quiz, communications, and integrations.

## Current Implementation Status

Last updated: 2026-06-06

Frontend P0 foundation work is partially implemented in `edubot-tenant-hub`, and the backend `/me/context` bootstrap endpoint has been implemented in `edubot-learning-backend` branch `feat/me-context`.

### Completed in the tenant frontend

- API client foundation:
  - `src/lib/api/client.ts` uses `VITE_API_BASE_URL`.
  - Adds bearer token when present.
  - Sends `x-company-id` for tenant-scoped requests when an active tenant is stored.
  - Sends `Accept-Language` from i18n state.
  - Handles CSRF retry behavior.
  - Emits an auth-expired event on `401`.
- App context foundation:
  - `src/lib/app-context.tsx` resolves public tenant context before login.
  - Authenticated context loads from compatibility endpoints by default.
  - `/me/context` support exists behind `VITE_USE_APP_CONTEXT_ENDPOINT=true`.
  - `/me/context` now sends the active tenant header so the backend can honor the saved active company on neutral hosts.
- Auth flow:
  - `/auth` calls backend `/auth/login` in backend mode.
  - Login stores backend token and refetches app context.
  - Root guard redirects protected routes to `/auth` when no token exists.
  - Cookie-only session bootstrap can be enabled with `VITE_AUTH_SESSION_MODE=cookie` or `VITE_USE_COOKIE_AUTH=true`.
  - Authenticated users without tenant workspace membership see a no-workspace access screen instead of entering the tenant shell with fallback demo data.
  - Sidebar logout clears local token, active tenant, cached app context, and redirects to `/auth`.
- Tenant branding:
  - Auth shell uses `AppContext.activeTenant` branding.
  - Login/auth shell displays tenant name, tenant logo URL when available, tenant logo text fallback, and tenant brand color.
  - Root and instructor dashboard metadata no longer use the old QuestLMS brand.
- Backend-controlled role authority:
  - `src/lib/roles.tsx` derives the active role from `AppContext.activeRole` in backend mode.
  - `questlms.role` localStorage is only used in prototype mode.
  - Route path changes no longer mutate active role in backend mode.
  - Manual role switching is hidden in backend mode and remains available only in prototype mode.
- Route access guard:
  - `src/lib/route-access.ts` defines public route and role-prefix rules.
  - `src/components/auth/AccessDenied.tsx` shows an access-denied state for role-incompatible pages.
  - Root route wraps protected app content with `RouteAccessGate`.
  - Backend mode blocks routes outside the active backend role.
  - Backend mode now fails closed for protected routes that are not explicitly listed in the route access table.
  - Prototype mode stays flexible for design review.
- Sidebar filtering:
  - `src/components/dashboard/Sidebar.tsx` filters nav items with `canAccessRoute()` in backend mode.
  - Users do not see nav links that their backend-active role cannot open.
- Tenant hook cleanup:
  - `src/hooks/use-tenant.ts` reads tenant data from app context in backend mode.
  - Static tenant presets are limited to prototype fallback behavior.

### Implemented in backend branch `feat/me-context`

- Added `GET /me/context` through `MeContextController`.
- Added `AppContextService` to aggregate:
  - authenticated safe user profile
  - platform role
  - active workspace
  - active tenant
  - tenant role
  - workspace list
  - frontend permission keys
  - feature flags
  - unread notification count placeholder
- Reuses current backend sources:
  - `AuthService.getUserById()`
  - `CompaniesService.listWorkspaces()`
- Honors active tenant context from `x-company-id`/request tenant context through `getActiveCompanyId(req)`.
- Normalizes backend `main` workspace to frontend `platform` workspace.

Compatibility endpoints still used by default until the frontend flag is enabled:

```text
GET /auth/profile
GET /companies/workspaces
GET /tenant-context/resolve?host=<host-or-slug>
```

### Still pending for full P0 completion

- Review, test, and merge backend branch `feat/me-context`.
- Enable `VITE_USE_APP_CONTEXT_ENDPOINT=true` after backend deployment validation.
- Add regression tests for `/me/context` active tenant selection, platform workspace fallback, suspended memberships, and permission mapping.
- Confirm `/auth/login` consistently returns either `token` or `access_token` for frontend fallback mode.
- If backend uses HTTP-only cookie sessions instead of response tokens, set `VITE_AUTH_SESSION_MODE=cookie` and validate refresh/login/logout behavior in that mode.
- Confirm `/companies/workspaces` returns an empty tenant workspace list for authenticated users who have no tenant assignment, so frontend can show the no-workspace access screen.
- Confirm tenant resolver returns enough branding fields for shell/auth identity.
- Add deeper permission-based filtering for actions inside pages, not only route/sidebar visibility.
- Wire invite acceptance, account activation, forgot-password, and reset-password UI to backend endpoints.
- Run local/CI `npm run build` and `npm run lint` before merging the PR.

Important UX decision:

- No extra tenant/workspace card should be added to the sidebar. Tenant branding is already shown through the sidebar brand area and auth shell. A workspace switcher can be added later only if product/UX requires it, without duplicating tenant branding.

## New Profiles Workstream

A dedicated profile planning document has been added:

```text
./TENANT_ROLE_PROFILES_PLAN.md
```

This document covers:

- shared account/profile settings
- instructor profile
- student profile
- parent/guardian child summaries
- admin staff/member profiles
- backend readiness by area
- recommended profile view-model contracts
- frontend integration phases

### Profile workstream priority

Profiles are now treated as the next role-depth workstream after the auth/context foundation.

Recommended execution order:

1. Shared profile/settings:
   - `GET /profile/me`
   - `PATCH /profile/me`
   - `PATCH /profile/me/preferences`
   - frontend: `src/routes/settings.tsx`
2. Student profile:
   - `GET /student/profile`
   - frontend: `src/routes/student.profile.tsx`
3. Instructor profile:
   - `GET /profile/instructor/me`
   - `PATCH /profile/instructor/me`
   - frontend: `src/routes/instructor.profile.tsx`
4. Admin staff/member profiles:
   - `GET /companies/:companyId/members`
   - `GET /companies/:companyId/people/:userId/profile`
   - frontend: `src/routes/admin.staff.tsx`
5. Parent/guardian children:
   - `GET /parent/children`
   - `GET /parent/children/:studentId/summary`
   - frontend: `src/routes/parent.children.tsx`

The first concrete profile task should be shared profile/settings because it supports every role and removes the largest amount of static account data safely.

## P0 - Foundation Blockers

### 1. App Context Contract

Recommended endpoint:

```text
GET /me/context
```

Response should include:

- authenticated user profile
- platform role
- tenant memberships and tenant roles
- active company/workspace
- permissions
- tenant branding
- tenant locale/timezone
- plan, limits, and feature flags
- notification unread counts
- CSRF/session metadata if needed by frontend

Frontend/backend status:

- `src/lib/api/client.ts` is implemented.
- `src/lib/app-context.tsx` is implemented with compatibility endpoint support.
- `src/lib/app-context.tsx` can call `/me/context` when `VITE_USE_APP_CONTEXT_ENDPOINT=true`.
- `src/hooks/use-tenant.ts` now uses app context in backend mode.
- `src/lib/roles.tsx` now uses backend role authority in backend mode.
- Manual role switching is prototype-only.
- Backend branch `feat/me-context` implements the first `/me/context` endpoint.
- Backend `/me/context` should be validated and merged before making the frontend flag default.

### 2. Tenant Context And Permissions

Required behavior:

- Every tenant request must include active company context.
- Backend must reject context mismatch.
- Frontend should not infer permissions from route path alone.
- Backend should return permission flags that drive route visibility and disabled states.

Frontend/backend status:

- `x-company-id` is sent by the API client when active tenant is known and `skipTenantHeader` is not set.
- `/me/context` call keeps tenant header enabled.
- `Accept-Language` is sent by the API client.
- Route visibility is now guarded by active backend role.
- Sidebar nav is now filtered by active backend role.
- Backend `/me/context` maps backend workspace permission booleans into frontend permission keys.
- Deeper permission checks inside page actions are still pending.

### 3. UI-Ready Response Standards

Existing endpoints should be normalized where needed.

Required standards:

- Dates as ISO strings.
- Stable enum values.
- Paginated lists return `{ items, total, page, limit, totalPages }`.
- Mutations return updated resource plus `messageKey` when relevant.
- Errors return stable `code`.
- Dashboard/profile endpoints return blocks in the same shape the UI needs.

### 4. Contract Documentation

Required:

- Regenerate endpoint catalog after backend contract changes.
- Add explicit frontend response examples for new view-model endpoints.
- Add `/me/context` to the backend endpoint catalog after the backend PR is merged.
- Add profile endpoints from `TENANT_ROLE_PROFILES_PLAN.md` after the profile backend work starts.

## P1 - Core Tenant LMS

### Company Admin

Main screens:

- `/admin`
- `/admin/staff`
- `/admin/billing`
- `/admin/integrations`
- `/admin/hierarchy`

Backend endpoints to use or adapt:

```text
GET /companies/:id/dashboard
GET /companies/:id/members
POST /companies/:id/invitations
PATCH /companies/:id/members/:userId
DELETE /companies/:id/members/:userId
PATCH /companies/:id/branding
PATCH /companies/:id/settings
GET /companies/:id/activity
GET /companies/:id/reports/*
```

Frontend changes:

- Replace static admin members and invites with company member endpoints.
- Replace hardcoded billing cards with billing usage response.
- Replace integration mock state with tenant integration state.
- Replace hierarchy `localStorage` with tenant settings or backend feature flags.

### Instructor

Main screens:

- `/`
- `/classes`
- `/classes/$classId`
- `/courses`
- `/courses/$courseId`
- `/course-studio`
- `/calendar`
- `/grading`
- `/instructor/students`
- `/instructor/analytics`
- `/instructor/assignments`
- `/instructor/profile`

Backend endpoints to use or adapt:

```text
GET /companies/:id/instructor-dashboard
GET /courses
GET /courses/:id
GET /course-groups
GET /course-groups/:id
GET /course-groups/:id/students
GET /course-sessions
GET /attendance/sessions/:sessionId
GET /analytics/instructor/*
GET /profile/instructor/me
PATCH /profile/instructor/me
```

Frontend changes:

- Replace `src/lib/lmsStore.ts` course/class/lesson/schedule logic with backend queries and mutations.
- Rename frontend "classes" data model to backend `course-groups` at the API boundary.
- Replace static instructor profile data using the profile workstream contract.

### Student

Main screens:

- `/student`
- `/student/courses`
- `/course-player`
- `/student/quizzes`
- `/student/submissions`
- `/student/certificates`
- `/student/leaderboard`
- `/student/profile`
- `/ai-tutor`
- `/ai-study-plan`
- `/xp`
- `/badges`

Backend endpoints to use or adapt:

```text
GET /student/home
GET /student/courses
GET /student/courses/:courseId
GET /student/progress
GET /student/progress/summary
GET /student/sessions/upcoming
GET /student/reminders
GET /student/resources
GET /student/recordings
GET /student/homework
GET /student/certificates
GET /student/notifications
GET /skills
GET /skills/me/progress
GET /student/profile
```

Frontend changes:

- Replace static student widgets with `/student/home`.
- Replace course player outline mock with `/student/courses/:courseId`.
- Replace static student profile data using `/student/profile`.
- Replace local gamification storage with backend leaderboard, skills, XP/streak/badge data as it becomes available.

### Shared Settings/Profile

Main screen:

- `/settings`

Backend endpoints to add:

```text
GET /profile/me
PATCH /profile/me
PATCH /profile/me/preferences
```

Frontend changes:

- Replace static settings profile fields.
- Replace notification settings with backend preferences.
- Keep all visible text Kyrgyz/Russian-ready through i18n.

## P2 - Role Depth

### Parent / Guardian

Main screens:

- `/parent`
- `/parent/children`
- `/parent/schedule`
- `/parent/messages`
- `/parent/billing`

Backend endpoints to add:

```text
GET /parent/profile
PATCH /parent/profile
GET /parent/children
GET /parent/children/:studentId/summary
GET /parent/children/:studentId/progress
GET /parent/children/:studentId/attendance
GET /parent/schedule
GET /parent/messages
GET /parent/billing
```

Response requirements:

- Must only expose linked children.
- Must not expose private instructor/admin notes unless explicitly parent-visible.
- Must include read-only task, progress, attendance, certificate, and upcoming session data.

### Assistant

Main screens:

- `/assistant`
- `/assistant/grading`
- `/assistant/discussions`
- `/assistant/reports`

Backend endpoints to use or adapt:

```text
GET /companies/:id/assistant-dashboard
GET /companies/:id/student-support
GET /companies/:id/student-support/:studentId/notes
POST /companies/:id/student-support/notes
PATCH /companies/:id/student-support/notes/:noteId
```

### Owner / Platform Admin

Main screen:

- `/owner`

Backend endpoints to add or adapt:

```text
GET /admin/platform/dashboard
GET /admin/platform/tenants
GET /admin/platform/analytics
GET /admin/platform/system-health
GET /admin/platform/audit-log
GET /admin/platform/feature-flags
PATCH /admin/platform/feature-flags/:flagId
```

## P3 - Advanced Product

### AI

Backend endpoints to use or adapt:

```text
GET /ai-lms/capabilities
POST /ai-lms/courses/course-draft
POST /ai-lms/lessons/:lessonId/quiz-draft
POST /ai-lms/sessions/:sessionId/quiz-draft
POST /ai-lms/sessions/:sessionId/homework-draft
POST /ai-lms/sessions/:sessionId/worksheet-draft
POST /ai-lms/submissions/:submissionId/feedback-draft
POST /ai-lms/students/:studentId/message-draft
GET /ai-lms/generations/:generationId
PATCH /ai-lms/generations/:generationId/accept
PATCH /ai-lms/generations/:generationId/reject
```

### Live Quiz

Backend endpoints to add:

```text
POST /live-quizzes
GET /live-quizzes/:pin
POST /live-quizzes/:pin/join
POST /live-quizzes/:pin/start
POST /live-quizzes/:pin/questions/:questionId/answer
GET /live-quizzes/:pin/state
GET /live-quizzes/:pin/results
```

Use WebSocket, SSE, or short polling for live state.

### Communications

Backend endpoints to add:

```text
GET /communications/threads
POST /communications/threads
GET /communications/threads/:threadId/messages
POST /communications/threads/:threadId/messages
PATCH /communications/threads/:threadId/read
GET /communications/announcements
POST /communications/announcements
GET /communications/discussions
POST /communications/discussions
```

### Integrations

Backend endpoints to add or adapt:

```text
GET /companies/:id/integrations
PATCH /companies/:id/integrations/:integrationKey
GET /companies/:id/integrations/:integrationKey/health
GET /companies/:id/api-keys
POST /companies/:id/api-keys
DELETE /companies/:id/api-keys/:keyId
```

## Role-by-Role Summary

| Role | Priority | Backend Focus | Frontend Focus |
| --- | --- | --- | --- |
| All roles | P0/P1 | `/me/context`, tenant scope, permissions, `/profile/me` | API client, auth/session provider, route guards, settings/profile |
| Company admin | P1 | dashboard, members, billing usage, settings, activity | admin dashboard, staff, billing, branding, integrations |
| Instructor | P1 | course groups, sessions, attendance, grading, instructor profile | instructor dashboard, classes, course/session pages, profile |
| Student | P1 | student home, courses, progress, certificates, student profile | student dashboard, course player, submissions, certificates, profile |
| Parent | P2 | guardian access and parent portal endpoints | parent dashboard, children, schedule, messages, billing |
| Assistant | P2 | support queue, assistant dashboard, moderation | assistant dashboard, grading, discussions, reports |
| Owner | P2 | platform dashboard, tenants, feature flags, health | owner HQ |
| AI users | P3 | AI generation persistence and acceptance | AI generator, grading, tutor, study plan |
| Live quiz users | P3 | real-time quiz room contract | host/join/results flows |

## Suggested Execution Phases

### Phase 1 - Contract Foundation

- Define `/me/context`. **Status: implemented in backend branch `feat/me-context`; pending review, tests, and deployment.**
- Define response standards.
- Regenerate backend endpoint catalog.
- Add frontend API client and query conventions. **Status: partially done.**
- Add tenant/session provider. **Status: partially done through `AppContextProvider`.**
- Add backend-controlled role authority. **Status: done in frontend compatibility mode.**
- Add route access guards. **Status: done for route prefixes and sidebar links.**

Exit criteria:

- Frontend can identify authenticated user, active workspace, tenant role, permissions, branding, locale, and feature flags from backend.

### Phase 2 - Shared Profile And Tenant Shell

- Implement `/profile/me` contracts.
- Integrate `/settings` with real profile/preferences.
- Integrate company dashboard.
- Integrate members/invites.
- Integrate tenant branding/settings.
- Add billing usage contract.

Exit criteria:

- Authenticated users can manage their own profile/settings from real backend data.
- Company admin can manage tenant basics from real data.

### Phase 3 - LMS Core

- Integrate courses, sections, lessons.
- Integrate course groups as classes.
- Integrate sessions and attendance.
- Add calendar aggregation.
- Replace `lmsStore.ts` usage.

Exit criteria:

- Instructor/admin can create course content, create classes/groups, schedule sessions, and mark attendance using backend data.

### Phase 4 - Student Portal And Profiles

- Integrate `/student/home`.
- Integrate student courses and course player.
- Integrate homework, submissions, resources, recordings, certificates.
- Integrate notifications.
- Integrate `/student/profile`.

Exit criteria:

- Student can use the LMS and profile surfaces without mock data.

### Phase 5 - Instructor, Parent, Assistant, Owner Role Depth

- Integrate instructor profile.
- Add parent portal backend and integrate parent screens.
- Complete assistant dashboard/support/moderation flows.
- Add platform owner dashboard contracts.

Exit criteria:

- All visible roles are permission-backed and data-backed.

### Phase 6 - Advanced Features

- Integrate AI LMS generation flows.
- Add AI study plan if needed.
- Add live quiz real-time contract.
- Add communication module.
- Add integration marketplace and API keys.

Exit criteria:

- Differentiator features work from persistent backend state.

## Frontend Files Most Likely To Change First

- `src/lib/api/client.ts`
- `src/lib/app-context.tsx`
- `src/lib/route-access.ts`
- `src/hooks/use-tenant.ts`
- `src/lib/roles.tsx`
- `src/lib/profile/profile-api.ts`
- `src/routes/settings.tsx`
- `src/routes/student.profile.tsx`
- `src/routes/instructor.profile.tsx`
- `src/routes/admin.staff.tsx`
- `src/routes/parent.children.tsx`
- `src/lib/lmsStore.ts`
- `src/lib/quizStore.ts`
- `src/routes/__root.tsx`
- `src/components/auth/AuthShell.tsx`
- `src/components/auth/AccessDenied.tsx`
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/dashboard/Sidebar.tsx`
- `src/components/dashboard/RoleSwitcher.tsx`

## Backend Areas Most Likely To Change First

- `src/auth/*`
- `src/common/tenant-context*`
- `src/companies/*`
- `src/profile/*`
- `src/users/*`
- `src/students/*`
- `src/skills/*`
- `src/certificates/*`
- `src/courses/*`
- `src/course-groups/*`
- `src/group-sessions/*`
- `src/attendance/*`
- `src/notifications/*`
- `src/ai-lms/*`
- `docs/shared/contracts/*`

## Open Decisions

- When should `VITE_USE_APP_CONTEXT_ENDPOINT=true` become the default frontend path?
- Should auth tokens remain sessionStorage-only, or should backend rely fully on HTTP-only cookies?
- Should root auth guard protect every route except the current public list, or should each route declare `public/protected` metadata?
- Should workspace switching be exposed in the sidebar, profile menu, or not exposed until multi-workspace UX is designed?
- Should parent/guardian be a first-class tenant role or a derived access relationship from `student_guardians`?
- Should user-level locale/timezone live on `users`, `user_preferences`, or tenant membership settings?
- Should display name be added separately from `fullName`?
- Should instructor credentials be stored as JSON on user profile first or normalized into an `instructor_credentials` table?
- Should XP/streak/badges be implemented as a real gamification module or derived from progress/events first?
- Should "class" remain frontend wording while backend uses `course-group`, or should UI copy shift to "groups/cohorts"?
- Should tenant dashboard endpoints return fixed blocks or configurable block arrays?
- Should calendar be a global endpoint or separate role-specific endpoints?
- Should messages, discussions, announcements, and notifications be one communication module or separate modules?
- Should live quiz use WebSocket, SSE, or polling for the first production version?
