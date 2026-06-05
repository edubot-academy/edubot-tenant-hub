# Tenant Frontend Backend Alignment Plan

## Purpose

This document turns the current tenant frontend audit into an implementation plan. The frontend already contains the target user experience for a tenant LMS, but most screens are prototype-driven with static data or `localStorage`. The backend already has many matching domain modules, but existing endpoints must be adapted into UI-ready tenant contracts.

The goal is not only to connect existing endpoints. The goal is to make backend responses match the new UI, permission model, tenant context, filters, summaries, and role-specific workflows.

## Priority Model

- **P0 - Foundation blocker:** Required before real tenant data can be used safely.
- **P1 - Core tenant LMS:** Required for a usable tenant product.
- **P2 - Role depth:** Required for each persona to feel production-ready.
- **P3 - Advanced product:** Differentiators such as AI, gamification, live quiz, integrations.

## Current Implementation Status

Last updated: 2026-06-06

Frontend P0 foundation work has started and is partially implemented.

Implemented in this repo:

- API client: `src/lib/api/client.ts`
  - Uses `VITE_API_BASE_URL`.
  - Adds auth bearer token when present.
  - Adds `x-company-id` for tenant-scoped requests when an active tenant is stored.
  - Adds `Accept-Language` from i18n state.
  - Handles CSRF retry behavior.
  - Emits an auth-expired event on `401`.
- App context provider: `src/lib/app-context.tsx`
  - Resolves public tenant context before login.
  - Loads authenticated context after login.
  - Uses current backend compatibility endpoints by default.
  - Keeps future `/me/context` support behind `VITE_USE_APP_CONTEXT_ENDPOINT=true`.
- Auth flow:
  - `/auth` calls backend `/auth/login` when backend mode is enabled.
  - Login stores backend token and reloads app context.
  - Root-level guard redirects protected routes to `/auth` when no token exists.
  - Public routes currently excluded: `/auth`, `/invite`, `/reset-password`, `/live-quiz-join`.
  - Sidebar logout clears local token, active tenant, cached app context, and redirects to `/auth` even when backend `/auth/logout` fails.
- Tenant recognition:
  - Local query-param recognition supports `?tenant=<slug>` and `?tenantId=<id>`.
  - Local default sends `host=<slug>` to `/tenant-context/resolve`.
  - Production-style expansion is opt-in through `VITE_TENANT_QUERY_BASE_DOMAIN`.
  - Custom `x-tenant-host` header was removed to avoid local CORS preflight failures.
- Tenant display:
  - Sidebar and mobile shell display resolved tenant branding.
  - Existing tenant hook now reads from app context instead of static presets when context exists.
- Versioning:
  - `CHANGELOG.md` was added.
  - Initial private app version is `0.1.0`.
  - Future release PRs should update `package.json`, `package-lock.json`, and `CHANGELOG.md` together.

Backend still required for full P0 completion:

- Implement or intentionally defer `GET /me/context`.
- Keep current compatibility endpoints stable until `/me/context` is available:
  - `GET /auth/profile`
  - `GET /companies/workspaces`
  - `GET /tenant-context/resolve?host=<host-or-slug>`
- Confirm `/auth/login` response includes either `token` or `access_token`.
- Confirm tenant resolver returns enough branding fields for shell identity:
  - `id` or `companyId`
  - `name`
  - `slug`
  - optional `branding.primaryColor`
  - optional `branding.logoText`
  - optional `logoUrl`

## Versioning And Changelog Rules

The repo now uses a lightweight SemVer-style release process for this private frontend app.

Version source of truth:

- `package.json`
- `package-lock.json`
- `CHANGELOG.md`

Rules:

- `MAJOR`: user-facing or backend-contract changes that require coordinated backend migration, data migration, route migration, or tenant rollout planning.
- `MINOR`: new user-facing features, new backend integrations, new routes, new app contexts, or meaningful UI/workflow additions that are backward compatible.
- `PATCH`: bug fixes, copy changes, styling fixes, small endpoint compatibility fixes, dependency fixes, and non-breaking internal cleanup.

Changelog requirements:

- Keep `CHANGELOG.md` updated for every meaningful frontend/backend integration change.
- Mention backend contract changes explicitly, including endpoint names.
- Mention Lovable compatibility risks explicitly when dependency, routing, build, or TanStack Start config changes are made.
- Do not record generated build output or formatting-only edits unless runtime behavior changes.

## P0 - Foundation Blockers

### 1. App Context Contract

Add a single frontend bootstrap endpoint.

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

Backend source to build from:

- `/auth/profile`
- `/companies/workspaces`
- `/companies/workspaces/switch`
- `/companies/:id`

Frontend changes:

- Replace hardcoded tenant presets in `src/hooks/use-tenant.ts`. **Status: partially done. Existing hook now reads app context when available, with static fallback for prototype mode.**
- Replace local role switcher state in `src/lib/roles.tsx`.
- Add `src/lib/api/client.ts`. **Status: done.**
- Add an auth/session provider backed by TanStack Query. **Status: partially done through `AppContextProvider`; dedicated session abstraction can be added later if needed.**

Current frontend compatibility mode:

- `/me/context` is not called by default because the local backend currently returns `404`.
- To test the future consolidated endpoint, set:

```env
VITE_USE_APP_CONTEXT_ENDPOINT=true
```

- Without that flag, authenticated refresh uses:

```text
GET /auth/profile
GET /companies/workspaces
GET /tenant-context/resolve?host=<host-or-slug>
```

### 2. Tenant Context And Permissions

Standardize how frontend sends tenant context.

Required behavior:

- Every tenant request must include active company context. **Status: API client sends `x-company-id` when active tenant is known and `skipTenantHeader` is not set.**
- Backend must reject context mismatch.
- Frontend should not infer permissions from route path alone.
- Backend should return permission flags that drive route visibility and disabled states.

Recommended request conventions:

- Auth via current backend-supported cookie/JWT flow.
- `x-company-id` or host-based tenant resolution for tenant calls. **Status: implemented client-side.**
- `Accept-Language` from frontend i18n state. **Status: implemented client-side.**

### 3. UI-Ready Response Standards

Existing endpoints should be normalized where needed.

Required standards:

- Dates as ISO strings.
- Stable enum values.
- Paginated lists return `{ items, total, page, limit, totalPages }`.
- Mutations return updated resource plus `messageKey` when relevant.
- Errors return stable `code`.
- Dashboard endpoints return blocks in the same shape the UI needs.

### 4. Contract Documentation

Regenerate and keep backend endpoint docs current.

Current issue:

- `../backend/docs/shared/contracts/API_ENDPOINT_CATALOG.md` is stale for the student portal. The controller has endpoints such as `/student/courses`, `/student/home`, `/student/progress/summary`, `/student/reminders`, and `/student/resources` that are not fully reflected.

Required:

- Regenerate endpoint catalog after backend contract changes.
- Add explicit frontend response examples for new view-model endpoints.

## P1 - Core Tenant LMS

### Company Admin

Main screens:

- `/admin`
- `/admin/staff`
- `/admin/billing`
- `/admin/integrations`
- `/admin/hierarchy`

Backend endpoints to use or adapt:

- `GET /companies/:id/dashboard`
- `GET /companies/:id/members`
- `POST /companies/:id/invitations`
- `PATCH /companies/:id/members/:userId`
- `DELETE /companies/:id/members/:userId`
- `PATCH /companies/:id/branding`
- `PATCH /companies/:id/settings`
- `GET /companies/:id/activity`
- `GET /companies/:id/reports/*`

Backend changes needed:

- Ensure `/companies/:id/dashboard` returns admin UI blocks: KPIs, setup checklist, active courses, staff summary, billing summary, alerts, recent activity.
- Add billing usage and invoices contracts:

```text
GET /companies/:id/billing/usage
GET /companies/:id/billing/invoices
GET /companies/:id/billing/subscription
PATCH /companies/:id/billing/plan
```

- Add tenant API key lifecycle if integrations page keeps API keys:

```text
GET /companies/:id/api-keys
POST /companies/:id/api-keys
PATCH /companies/:id/api-keys/:keyId
DELETE /companies/:id/api-keys/:keyId
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

Backend endpoints to use or adapt:

- `GET /companies/:id/instructor-dashboard`
- `GET /courses`
- `GET /courses/:id`
- `POST /courses`
- `PATCH /courses/:id`
- `GET /courses/:courseId/sections`
- `POST /courses/:courseId/sections`
- `GET /courses/:courseId/sections/:sectionId/lessons`
- `POST /courses/:courseId/sections/:sectionId/lessons`
- `PATCH /courses/:courseId/sections/:sectionId/lessons/:id`
- `DELETE /courses/:courseId/sections/:sectionId/lessons/:id`
- `GET /course-groups`
- `GET /course-groups/:id`
- `GET /course-groups/:id/students`
- `GET /course-sessions`
- `POST /course-sessions`
- `PATCH /course-sessions/:id`
- `GET /attendance/sessions/:sessionId`
- `POST /attendance/sessions/:sessionId/bulk`
- `GET /analytics/instructor/*`

Backend changes needed:

- Ensure `course-groups` response matches the UI's "class" concept: display name, code, student count, next session, assigned course, instructor, status, color/branding optional.
- Add a calendar aggregation endpoint:

```text
GET /calendar
```

It should aggregate sessions, homework due dates, grading deadlines, office hours, live events, and reminders.

- Add or adapt assignment/grading queue endpoint:

```text
GET /companies/:id/grading-queue
GET /companies/:id/assignments
```

- Add placement-test endpoints because frontend has authoring and runner flows:

```text
GET /courses/:courseId/placement-test
PUT /courses/:courseId/placement-test
DELETE /courses/:courseId/placement-test
POST /courses/:courseId/placement-test/attempts
GET /courses/:courseId/placement-test/attempts
```

Frontend changes:

- Replace `src/lib/lmsStore.ts` course/class/lesson/schedule logic with backend queries and mutations.
- Rename frontend "classes" data model to backend `course-groups` at the API boundary.
- Map frontend modules to backend sections.
- Map frontend lessons to backend lessons.
- Map schedule dialogs to `course-sessions` or group schedule defaults.

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

- `GET /student/home`
- `GET /student/courses`
- `GET /student/courses/:courseId`
- `GET /student/progress`
- `GET /student/progress/summary`
- `GET /student/sessions/upcoming`
- `GET /student/reminders`
- `GET /student/resources`
- `GET /student/recordings`
- `GET /student/homework`
- `GET /student/certificates`
- `GET /student/notifications`
- `GET /leaderboard/*`
- `GET /skills`
- `GET /courses/:courseId/ai/chats`
- `POST /ai/chats/:chatId/messages`

Backend changes needed:

- Ensure `/student/home` returns all dashboard blocks currently shown by the UI: today hero, todos, progress cards, materials, certificates, streak, XP/league, quiz entry, AI tutor suggestions.
- Add student notes if notes should persist:

```text
GET /student/notes
POST /student/notes
PATCH /student/notes/:noteId
DELETE /student/notes/:noteId
```

- Confirm course-player response includes sections, lessons, media, current progress, next lesson, completion action, and access state.

Frontend changes:

- Replace static student widgets with `/student/home`.
- Replace course player outline mock with `/student/courses/:courseId`.
- Replace local gamification storage with backend leaderboard, skills, and XP responses.

## P2 - Role Depth

### Parent / Guardian

Current frontend has parent screens, but backend role model does not fully expose a parent portal role. Backend has guardian data entities, but the portal contract needs to be added.

Main screens:

- `/parent`
- `/parent/children`
- `/parent/schedule`
- `/parent/messages`
- `/parent/billing`

Backend changes needed:

- Add tenant role or access model for `parent`/`guardian`.
- Add guardian login/access rules.
- Add parent portal endpoints:

```text
GET /parent/home
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

Frontend changes:

- Replace static child selector, progress recap, schedule, messages, billing with parent endpoints.
- Hide parent role if user has no guardian access.

### Assistant

Main screens:

- `/assistant`
- `/assistant/grading`
- `/assistant/discussions`
- `/assistant/reports`

Backend endpoints to use or adapt:

- `GET /companies/:id/assistant-dashboard`
- `GET /companies/:id/student-support`
- `GET /companies/:id/student-support/:studentId/notes`
- `POST /companies/:id/student-support/notes`
- `PATCH /companies/:id/student-support/notes/:noteId`
- grading queue endpoints from instructor/admin scope

Backend changes needed:

- Add moderation/discussion queue if discussions remain in scope:

```text
GET /companies/:id/moderation-queue
PATCH /companies/:id/moderation-queue/:itemId
```

- Ensure assistant dashboard returns support tickets, grading queue, response-time metrics, and student risk alerts.

Frontend changes:

- Replace static assistant tickets, analytics, discussions, reports with assistant dashboard and support endpoints.

### Owner / Platform Admin

Main screens:

- `/owner`

Backend endpoints to use or adapt:

- `GET /companies`
- `GET /companies/:id`
- platform AI admin endpoints under `/ai-lms/admin/*`
- integration admin endpoints

Backend changes needed:

- Add owner dashboard view model:

```text
GET /admin/platform/dashboard
GET /admin/platform/tenants
GET /admin/platform/analytics
GET /admin/platform/system-health
GET /admin/platform/audit-log
GET /admin/platform/feature-flags
PATCH /admin/platform/feature-flags/:flagId
```

Frontend changes:

- Replace owner static metrics, tenant table, system health, security center, and feature flags with platform admin endpoints.
- Hide owner surfaces for tenant-only users.

## P3 - Advanced Product

### AI

Current frontend has AI generator, AI grading, AI tutor, and AI study plan. Backend already has both course chat AI and AI LMS generation endpoints.

Backend endpoints to use:

- `GET /ai-lms/capabilities`
- `POST /ai-lms/courses/course-draft`
- `POST /ai-lms/lessons/:lessonId/quiz-draft`
- `POST /ai-lms/sessions/:sessionId/quiz-draft`
- `POST /ai-lms/sessions/:sessionId/homework-draft`
- `POST /ai-lms/sessions/:sessionId/worksheet-draft`
- `POST /ai-lms/submissions/:submissionId/feedback-draft`
- `POST /ai-lms/students/:studentId/message-draft`
- `GET /ai-lms/generations/:generationId`
- `PATCH /ai-lms/generations/:generationId/accept`
- `PATCH /ai-lms/generations/:generationId/reject`

Backend changes needed:

- Add AI study plan endpoint if not covered by current generation types:

```text
POST /ai-lms/students/:studentId/study-plan-draft
```

- Ensure generated quiz drafts can be saved into the real quiz/session activity domain.

Frontend changes:

- Replace `quizStore.ts` with AI generation history and accepted generation records.
- Replace mock tutor response with course AI chat endpoints.

### Live Quiz

Current frontend has host and join pages, but backend needs a real-time contract.

Backend changes needed:

```text
POST /live-quizzes
GET /live-quizzes/:pin
POST /live-quizzes/:pin/join
POST /live-quizzes/:pin/start
POST /live-quizzes/:pin/questions/:questionId/answer
GET /live-quizzes/:pin/state
GET /live-quizzes/:pin/results
```

Use WebSocket or short polling for live state.

Frontend changes:

- Replace static live quiz players and answers with live room state.
- Add reconnect and host controls.

### Communications

Current frontend has messages, discussions, announcements, parent messages, notifications, and moderation. Backend currently has notifications and instructor chat, but the UI needs one coherent communication contract.

Backend changes needed:

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

Frontend changes:

- Replace separate static message/discussion arrays with shared communication queries.
- Keep role-specific filters in the frontend, but permissions and visibility come from backend.

### Integrations

Backend already supports CRM and Zoom-related modules, but the frontend has a general integration marketplace and API keys.

Backend changes needed:

```text
GET /companies/:id/integrations
PATCH /companies/:id/integrations/:integrationKey
GET /companies/:id/integrations/:integrationKey/health
GET /companies/:id/api-keys
POST /companies/:id/api-keys
DELETE /companies/:id/api-keys/:keyId
```

Frontend changes:

- Replace hardcoded integration marketplace states with backend installed/enabled/health statuses.

## Role-by-Role Summary

| Role | Priority | Backend Focus | Frontend Focus |
| --- | --- | --- | --- |
| All roles | P0 | `/me/context`, tenant scope, permissions, docs | API client, auth/session provider, route guards |
| Company admin | P1 | dashboard, members, billing usage, settings, activity | admin dashboard, staff, billing, branding, integrations |
| Instructor | P1 | course groups, sessions, attendance, grading, calendar | replace `lmsStore`, class/course/session pages |
| Student | P1 | student home, courses, progress, resources, homework | student dashboard, course player, submissions, certificates |
| Parent | P2 | guardian role and parent portal endpoints | parent dashboard, children, schedule, messages, billing |
| Assistant | P2 | support queue, assistant dashboard, moderation | assistant dashboard, grading, discussions, reports |
| Owner | P2 | platform dashboard, tenants, feature flags, health | owner HQ |
| AI users | P3 | AI generation persistence and acceptance | AI generator, grading, tutor, study plan |
| Live quiz users | P3 | real-time quiz room contract | host/join/results flows |

## Suggested Execution Phases

### Phase 1 - Contract Foundation

- Define `/me/context`. **Backend pending; frontend support is opt-in through `VITE_USE_APP_CONTEXT_ENDPOINT=true`.**
- Define response standards.
- Regenerate backend endpoint catalog.
- Add frontend API client and query conventions. **Done for base client, auth token, tenant header, language header, and CSRF retry.**
- Add tenant/session provider. **Partially done through app context provider and root auth guard.**
- Keep compatibility path working until `/me/context` exists:

```text
GET /auth/profile
GET /companies/workspaces
GET /tenant-context/resolve?host=<host-or-slug>
```

Exit criteria:

- Frontend can identify authenticated user, active workspace, tenant role, permissions, branding, locale, and feature flags from backend.

Current status against exit criteria:

- Authenticated user: partially wired through `/auth/profile`.
- Active workspace: partially wired through `/companies/workspaces`.
- Tenant branding: partially wired through `/tenant-context/resolve` and workspace branding.
- Tenant role: partially wired from workspace role.
- Permissions: mapped when workspace permissions are returned.
- Feature flags: mapped when workspace feature flags are returned.
- Locale/timezone: mapped with frontend defaults when backend omits values.

### Phase 2 - Admin And Tenant Shell

- Integrate company dashboard.
- Integrate members/invites.
- Integrate tenant branding/settings.
- Add billing usage contract.
- Replace role switcher with workspace/role selector.

Exit criteria:

- Company admin can manage tenant basics from real data.

### Phase 3 - LMS Core

- Integrate courses, sections, lessons.
- Integrate course groups as classes.
- Integrate sessions and attendance.
- Add calendar aggregation.
- Replace `lmsStore.ts` usage.

Exit criteria:

- Instructor/admin can create course content, create classes/groups, schedule sessions, and mark attendance using backend data.

### Phase 4 - Student Portal

- Integrate `/student/home`.
- Integrate student courses and course player.
- Integrate homework, submissions, resources, recordings, certificates.
- Integrate notifications.

Exit criteria:

- Student can use the LMS without mock data.

### Phase 5 - Parent, Assistant, Owner

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
- `src/hooks/use-tenant.ts`
- `src/lib/roles.tsx`
- `src/lib/lmsStore.ts`
- `src/lib/quizStore.ts`
- `src/routes/__root.tsx`
- `src/routes/auth.tsx`
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/dashboard/Sidebar.tsx`
- `src/components/dashboard/TenantBadge.tsx`
- `src/components/dashboard/RoleSwitcher.tsx`
- `src/routes/admin*.tsx`
- `src/routes/classes*.tsx`
- `src/routes/courses*.tsx`
- `src/routes/student*.tsx`
- `CHANGELOG.md`
- `package.json`
- `package-lock.json`

## Backend Areas Most Likely To Change First

- `src/auth/*`
- `src/common/tenant-context*`
- `src/companies/*`
- `src/courses/*`
- `src/course-groups/*`
- `src/group-sessions/*`
- `src/attendance/*`
- `src/students/*`
- `src/notifications/*`
- `src/ai-lms/*`
- `docs/shared/contracts/*`

## Open Decisions

- Should `/me/context` be implemented now, or should frontend continue using compatibility endpoints for the first backend-aligned release?
- Should auth tokens remain sessionStorage-only, or should backend rely fully on HTTP-only cookies?
- Should root auth guard protect every route except the current public list, or should each route declare `public/protected` metadata?
- Should query-param tenant resolution by raw slug remain supported outside local development?
- Should parent/guardian be a first-class tenant role or a derived access relationship from `student_guardians`?
- Should "class" remain frontend wording while backend uses `course-group`, or should UI copy shift to "groups/cohorts"?
- Should tenant dashboard endpoints return fixed blocks or configurable block arrays?
- Should calendar be a global endpoint or separate role-specific endpoints?
- Should messages, discussions, announcements, and notifications be one communication module or separate modules?
- Should live quiz use WebSocket, SSE, or polling for the first production version?
