# Tenant Frontend Backend Alignment Plan

## Purpose

This document is the master implementation plan for bringing `edubot-tenant-hub` onto real backend contracts.

The frontend already contains the target tenant LMS experience, but much of it is still prototype-driven with static data or `localStorage`. The backend already has many matching domain modules, but existing endpoints must be adapted into UI-ready tenant contracts and the remaining prototype pages must either be implemented or removed.

This document is intentionally focused on frontend/backend alignment work.

A separate companion document now covers app ownership, role semantics, and route migration between the main app and tenant hub:

```text
./TENANT_APP_BOUNDARY_AND_ROLE_MIGRATION_PLAN.md
```

An additional companion document now covers tenant operating-model choice and the academic-domain recommendation:

```text
./TENANT_OPERATING_MODEL_AND_ACADEMIC_DOMAIN_PLAN.md
```

Use this document for implementation sequencing. Use the companion document for deciding which app should own which role, route, and workflow.
Use the operating-model document when deciding whether a workflow should follow the current `course -> group -> session` structure or the future academic class model.

## Scope Boundary

This plan assumes the following product direction:

- `edubot-tenant-hub` is the authenticated tenant workspace.
- Tenant-facing roles belong here: `company_admin`, `instructor`, `assistant`, `student`, `parent`.
- The legacy main app remains the platform/public surface.
- Platform-only roles such as `admin` and `superadmin` should not be modeled as tenant roles inside tenant hub.

Where tenant hub still uses old `admin` or `owner` wording, that must be cleaned up as part of alignment work.

## Priority Model

- **P0 - Foundation blocker:** Required before real tenant data can be used safely.
- **P1 - Core tenant LMS:** Required for a usable tenant product.
- **P2 - Role depth:** Required for each tenant persona to feel production-ready.
- **P3 - Advanced product:** Differentiators such as AI, gamification, live quiz, integrations.

## Current Implementation Status

Last updated: 2026-06-07

### Already implemented

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
  - Supports `GET /me/context` behind `VITE_USE_APP_CONTEXT_ENDPOINT=true`.
- Auth flow:
  - `/auth` calls backend `/auth/login` when backend mode is enabled.
  - Login stores backend token and reloads app context.
  - Root-level guard redirects protected routes to `/auth` when no token exists.
  - Sidebar logout clears local token, active tenant, cached app context, and redirects to `/auth` even when backend `/auth/logout` fails.
- Tenant recognition:
  - Local query-param recognition supports `?tenant=<slug>` and `?tenantId=<id>`.
  - Local default sends `host=<slug>` to `/tenant-context/resolve`.
  - Production-style expansion is opt-in through `VITE_TENANT_QUERY_BASE_DOMAIN`.
- Tenant display:
  - Sidebar and mobile shell display resolved tenant branding.
  - Tenant hook reads from app context instead of only static presets when context exists.
- Shared profile/settings:
  - `GET /profile/me`
  - `PATCH /profile/me`
  - `PATCH /profile/me/preferences`
- Student profile:
  - `GET /student/profile`
  - `GET /student/certificates`
  - `src/routes/student.profile.tsx` and `src/routes/student.certificates.tsx` use backend data in API mode.
- Auth completion flows:
  - `src/routes/reset-password.tsx` — 2-step OTP flow calls `POST /auth/reset-password` with `{ identifier, method, otp, newPassword }`.
  - `src/routes/invite.$token.tsx` — calls `GET /auth/setup-account-preview?token=…` then `POST /auth/setup-account`; pre-fills name from `data.fullName`.
  - `src/routes/auth.activate.$token.tsx` — same preview + setup pattern; navigates with `replace: true` after success.
  - `src/routes/setup-account.tsx` — reads `?token` from URL search params; same preview + setup flow; this is what backend email links point to.
- Instructor grading and assignments:
  - `src/routes/instructor.grading.tsx` — `BackendGradingPage` uses `useInstructorGradingQueue()` calling `GET /companies/:id/grading-queue`.
  - `src/routes/instructor.assignments.tsx` — `BackendAssignmentsPage` uses `useInstructorAssignments()` calling `GET /companies/:id/assignments`, with group filter chips and KPI row.
- Instructor students:
  - `src/routes/instructor.students.tsx` — `BackendStudentsPage` uses `useInstructorStudents()` calling `GET /companies/:id/instructor-students`, with debounced search and group filter.
  - `GET /companies/:id/instructor-students` implemented on backend (multi-join over enrollments/groups/users/progress, scope-aware, paginated, filterable by groupId and name/email).
- Course-center class detail (instructor and company-admin):
  - `src/routes/classes.$classId.tsx` — `CourseCenterGroupBackend` component wired; loads group detail from `GET /course-groups/:id` and student list from `GET /course-groups/:id/students` in `course_center` API mode.
- Course-center student dashboard:
  - `src/routes/student.tsx` — `CourseCenterStudentBackendDashboard` added; uses `useStudentPortalHome()` calling `GET /student/home` for greeting, KPIs, urgent tasks, recent feedback, next session card, and active courses sidebar.

Implemented on backend and already usable by tenant hub:

- `GET /me/context`
- `GET /auth/profile`
- `GET /companies/workspaces`
- `GET /tenant-context/resolve?host=<host-or-slug>`
- `GET /profile/me`
- `PATCH /profile/me`
- `PATCH /profile/me/preferences`
- `GET /student/profile`
- `GET /student/certificates`
- `POST /auth/reset-password`
- `GET /auth/setup-account-preview`
- `POST /auth/setup-account`
- `GET /companies/:id/grading-queue`
- `GET /companies/:id/assignments`
- `GET /companies/:id/instructor-students`

Important architectural note:

- current LMS-core backend alignment work is still primarily `course_center` aligned
- school/university support should not harden `course_group = class` further until the operating-model plan is approved
- `CompaniesService` god-service extraction in progress: `CompanyBillingService` (billing, invoices, payment method) and `CompanyInstructorService` (instructor dashboard, grading queue, assignments, students, learning progress report) have been extracted as standalone `@Injectable()` services; `CompaniesService` now delegates to them — no API contract change

### Still pending

The following areas are still prototype/local-state driven or deferred:

- dedicated tenant integrations contracts (webhook/SSO/API-key management)
- instructor session scheduling, attendance marking, curriculum import, placement-test, and individual-enrollment operations (course_center)
- instructor messages and announcements
- student course player, quizzes, submissions, notes, and messages (course_center backend wiring)
- student achievements page — backend `GET /student/certificates` already exists; `student.achievements.tsx` still uses prototype data
- student leaderboard — no backend leaderboard endpoint yet
- student notifications — backend `GET /student/notifications` exists but frontend page not yet wired to it
- parent billing
- AI (LMS generation, AI tutor, AI study plan) and live quiz production contracts
- calendar aggregation endpoint and frontend calendar wiring

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

## P0 - Foundation Blockers

### 1. App Context Contract

Preferred bootstrap endpoint:

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

Current status:

- `GET /me/context` exists on backend.
- Compatibility mode using `/auth/profile` plus `/companies/workspaces` still exists and should remain until tenant hub fully switches over.

Frontend follow-up still needed:

- remove remaining prototype assumptions from `src/lib/roles.tsx`
- remove route-role inference where backend permissions should decide behavior
- finish migration from compatibility context to consolidated context once stable

### 2. Tenant Context And Permissions

Required behavior:

- Every tenant request must include active company context. **Status: implemented client-side.**
- Backend must reject context mismatch.
- Frontend should not infer permissions from route path alone.
- Backend should return permission flags that drive route visibility and disabled states.

### 3. UI-Ready Response Standards

Required standards:

- Dates as ISO strings.
- Stable enum values.
- Paginated lists return `{ items, total, page, limit, totalPages }`.
- Mutations return updated resource plus `messageKey` when relevant.
- Errors return stable `code`.
- Dashboard endpoints return blocks in the same shape the UI needs.

### 4. Contract Documentation

Required:

- Keep backend endpoint catalog current after contract changes.
- Add explicit frontend response examples for view-model endpoints.

## P1 - Core Tenant LMS

### 0. Role And App Boundary Cleanup

This must happen before broad prototype implementation so new work lands in the correct app and role namespace.

Required:

- tenant hub must use `company_admin` semantics explicitly
- platform `admin` and `superadmin` must remain main-app concepts
- current tenant hub `/owner` surface must be either:
  - removed, or
  - redefined as a real tenant-owner surface with separate backend scope
- frontend route, nav, i18n, and component naming should stop using ambiguous `admin` wording where it really means `company_admin`

Primary reference:

```text
./TENANT_APP_BOUNDARY_AND_ROLE_MIGRATION_PLAN.md
```

Exit criteria:

- tenant hub does not model platform admin as a tenant role
- tenant company admin surface is named consistently
- platform-only dashboards remain outside tenant hub

### 0.5. Tenant Operating Model Decision

Before deeper school/university LMS implementation, the product must explicitly support tenant operating-model selection.

Primary reference:

```text
./TENANT_OPERATING_MODEL_AND_ACADEMIC_DOMAIN_PLAN.md
```

Required:

- define tenant-level operating model in backend/app context
- treat current `course -> group -> session` flow as `course_center` aligned
- avoid assuming `course_group` is the final academic class abstraction

Exit criteria:

- planning and backend contracts distinguish `course_center` tenants from `academic` tenants
- Phase 4 work can state which operating model it is implementing

### 1. Company Admin

Main screens:

- `/admin` or renamed company-admin route group
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

- Ensure `/companies/:id/dashboard` returns company-admin UI blocks: KPIs, setup checklist, active courses, staff summary, billing summary, alerts, recent activity.
- Billing contracts now available:

```text
GET /companies/:id/billing/usage
GET /companies/:id/billing/invoices
GET /companies/:id/billing/subscription
PATCH /companies/:id/billing/plan
GET /companies/:id/billing/payment-method
PATCH /companies/:id/billing/payment-method
```

- Still needed to complete the billing domain:
  - downloadable invoice artifacts from a real ledger
  - provider-backed renewal period / next-invoice dates
  - external billing-provider sync instead of tenant-settings persistence

- Add tenant API key lifecycle if integrations page keeps API keys:

```text
GET /companies/:id/api-keys
POST /companies/:id/api-keys
PATCH /companies/:id/api-keys/:keyId
DELETE /companies/:id/api-keys/:keyId
```

Frontend changes:

- Replace static company-admin members and invites with company member endpoints.
- Replace hardcoded billing cards with truthful tenant-backed status and usage signals, then add dedicated billing contracts for invoices and payment methods.
- Replace integration mock state with tenant integration state.
- Replace hierarchy `localStorage` with tenant settings or backend feature flags.

Current implementation status:

- `src/routes/company-admin.staff.tsx` is backend-wired in API mode.
- `src/routes/company-admin.hierarchy.tsx` is backend-wired in API mode through tenant settings.
- `src/routes/company-admin.tsx` is backend-wired in API mode through `/companies/:id/dashboard`.
- `src/routes/company-admin.billing.tsx` is backend-wired in API mode for tenant status, plan, usage, invoice feed, editable payment-method metadata, and plan changes. Current invoice rows are settings-backed or derived from subscription state until a real ledger exists.
- `src/routes/company-admin.integrations.tsx` is backend-wired in API mode for truthful CRM/workspace integration status, while webhook/SSO/API-key actions remain deferred until dedicated tenant integration contracts exist.
- `src/routes/courses.tsx` is backend-wired in API mode for tenant course listing and `POST /courses` creation.
- `src/routes/courses.$courseId.tsx` is partially backend-wired in API mode for `GET /courses/:id`, `GET /courses/:id/sections`, `POST /courses/:id/sections`, `DELETE /courses/:id/sections/:sectionId`, `POST /courses/:id/sections/:sectionId/lessons`, and `DELETE /courses/:id/sections/:sectionId/lessons/:lessonId`. Curriculum import, placement tests, and individual enrollments are still prototype-only.
- `src/routes/classes.tsx` is backend-wired in API mode for `GET /course-groups` listing and `POST /course-groups` creation.
- `src/routes/classes.$classId.tsx` — in `course_center` API mode, the `CourseCenterGroupBackend` component loads group detail from `GET /course-groups/:id` and student roster from `GET /course-groups/:id/students`. Session scheduling and attendance marking remain prototype-backed in course_center mode. Academic tenant class management is fully wired via the academic domain backend.

### 2. Instructor

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

- Ensure `course-groups` response matches the UI's class concept.
- Add a calendar aggregation endpoint:

```text
GET /calendar
```

- Add placement-test endpoints if authoring and runner flows remain in scope.

Backend changes completed:

- `GET /companies/:id/grading-queue` — implemented; returns paginated homework/activity submission queue scoped to instructor.
- `GET /companies/:id/assignments` — implemented; returns homework assignments across instructor's groups.
- `GET /companies/:id/instructor-students` — implemented; returns paginated enrolled student roster scoped to instructor's groups, with progress percentage, filterable by groupId and name/email.

Frontend changes:

- Replace `src/lib/lmsStore.ts` course/class/lesson/schedule logic with backend queries and mutations.
- Map frontend classes to backend `course-groups` at the API boundary.
- Map frontend modules to backend sections.
- Map frontend lessons to backend lessons.

Current implementation status:

- `src/routes/courses.tsx` is backend-wired in API mode for tenant course listing and `POST /courses` creation.
- `src/routes/courses.$courseId.tsx` is partially wired for real section/lesson authoring. Curriculum import, placement tests, and individual enrollments remain prototype-only.
- `src/routes/classes.tsx` is backend-wired for course-group listing and creation.
- `src/routes/classes.$classId.tsx` — `CourseCenterGroupBackend` component wired in `course_center` API mode; session scheduling and attendance still prototype-backed in course_center.
- `src/routes/instructor.grading.tsx` is backend-wired in API mode using `GET /companies/:id/grading-queue`.
- `src/routes/instructor.assignments.tsx` is backend-wired in API mode using `GET /companies/:id/assignments`.
- `src/routes/instructor.students.tsx` is backend-wired in API mode using `GET /companies/:id/instructor-students`.
- `src/routes/instructor.analytics.tsx` is backend-wired in API mode using instructor analytics endpoints.
- `/instructor/messages`, `/instructor/discussions`, `/instructor/announcements` are intentionally truthful deferred screens until instructor communication contracts exist.

### 3. Student

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

Current status:

- `src/routes/student.profile.tsx` and `src/routes/student.certificates.tsx` are backend-wired in API mode.
- `src/routes/student.tsx` — in `course_center` API mode, `CourseCenterStudentBackendDashboard` uses `GET /student/home` for greeting, KPIs (open tasks, overdue, avg progress, certificates), urgent tasks list, recent feedback panel, next session card, and active courses sidebar. Academic student dashboard wired separately via academic domain APIs.
- `src/routes/student.courses.tsx`, `/student/quizzes`, `/student/submissions`, `/student/notes`, `/student/messages` still need backend wiring for course_center tenants.
- `src/routes/student.achievements.tsx` is still prototype-only even though `GET /student/certificates` backend endpoint already exists.
- `/student/leaderboard` is blocked — no backend leaderboard endpoint yet.
- `/student/notifications` backend endpoint exists but the frontend page is not yet wired.

Backend changes needed:

- Ensure `/student/home` returns all dashboard blocks currently shown by the UI.
- Add student notes if notes should persist.
- Confirm course-player response includes sections, lessons, media, current progress, next lesson, completion action, and access state.

Frontend changes:

- Replace static student widgets with `/student/home`.
- Replace course player outline mock with `/student/courses/:courseId`.
- Replace remaining local gamification storage with backend leaderboard, skills, and XP responses.

## P2 - Role Depth

### Parent / Guardian

Main screens:

- `/parent`
- `/parent/children`
- `/parent/schedule`
- `/parent/messages`
- `/parent/billing`

Backend changes needed:

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

Current status:

- `/parent`, `/parent/children`, `/parent/schedule`, and `/parent/messages` now use real guardian-linked backend data in backend mode.
- `/parent/billing` is intentionally a truthful deferred screen in backend mode because parent tuition billing is a separate domain from tenant subscription billing and does not have backend contracts yet.

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

Backend changes needed:

- add moderation/discussion queue if discussions remain in scope
- ensure assistant dashboard returns support tickets, grading queue, response-time metrics, and student risk alerts

Current status:

- `/assistant`, `/assistant/discussions`, and `/assistant/reports` now consume real backend assistant dashboard/support data in backend mode.
- `/assistant/grading` is intentionally a truthful deferred screen in backend mode because there is still no dedicated assistant grading queue contract.
- `/assistant/discussions` now also exposes real per-student support note history plus note create/update actions on top of the existing student-support note endpoints.
- `/notifications` now uses the real tenant-scoped backend notification inbox in backend mode.
- `/calendar` is intentionally a truthful deferred screen in backend mode until a unified cross-role calendar feed exists.
- `/instructor/analytics` now uses real backend instructor analytics in backend mode.
- `/instructor/discussions`, `/instructor/messages`, and `/instructor/announcements` are intentionally truthful deferred screens in backend mode until instructor communication contracts exist.
- `/xp` and `/badges` now use real student profile gamification summary data in backend mode.
- `/discover` and `/leagues` are intentionally truthful deferred screens in backend mode until learner discovery and leaderboard contracts exist.

### Owner / Platform Admin

This is no longer a default tenant-hub target surface.

Use the companion app-boundary plan to decide whether:

- the current `/owner` route is removed from tenant hub, or
- a real tenant-owner surface is introduced and kept separate from platform admin

Platform `admin` and `superadmin` should remain main-app scope.

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

### Live Quiz

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

### Communications

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

### Integrations

Backend changes needed:

```text
GET /companies/:id/integrations
PATCH /companies/:id/integrations/:integrationKey
GET /companies/:id/integrations/:integrationKey/health
GET /companies/:id/api-keys
POST /companies/:id/api-keys
DELETE /companies/:id/api-keys/:keyId
```

## Suggested Execution Phases

### Phase 1 - Contract Foundation

- keep `/me/context` and compatibility endpoints stable
- finalize response standards
- keep backend endpoint catalog current
- finish moving auth/session/bootstrap logic to one backend-backed context model

Exit criteria:

- frontend can identify authenticated user, active workspace, tenant role, permissions, branding, locale, and feature flags from backend

### Phase 2 - Role And App Boundary Cleanup

- rename tenant-hub admin semantics to `company_admin`
- decide fate of `/owner`
- remove tenant-hub assumptions that map platform admin to tenant owner
- update route groups, labels, nav, and docs to match

Exit criteria:

- tenant hub role model is tenant-scoped and no longer overlaps platform-admin semantics

### Phase 3 - Company Admin And Tenant Shell

- integrate company dashboard
- integrate members/invites
- integrate tenant branding/settings
- add billing plan/payment-method management after minimal billing read APIs
- replace role switcher assumptions with workspace/role selector behavior driven by backend context

Exit criteria:

- company admin can manage tenant basics from real data

### Phase 4 - LMS Core

- integrate courses, sections, lessons
- integrate course groups as classes
- integrate sessions and attendance
- add calendar aggregation
- replace `lmsStore.ts` usage

Exit criteria:

- instructor and company admin can create content, create groups, schedule sessions, and mark attendance using backend data

### Phase 5 - Student Portal Completion

- integrate `/student/home`
- integrate student courses and course player
- integrate homework, submissions, resources, recordings, notifications, and remaining gamification pages

Exit criteria:

- student can use the LMS without mock data

### Phase 6 - Parent And Assistant

- add parent portal backend and integrate parent screens
- complete assistant dashboard/support/moderation flows
- add assistant case-detail and mutation UI on top of student-support note endpoints

Exit criteria:

- all visible tenant roles are permission-backed and data-backed

### Phase 7 - Advanced Features

- integrate AI LMS generation flows
- add live quiz contract
- add communication module
- add integration marketplace and API keys

Exit criteria:

- differentiator features work from persistent backend state

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

## Open Decisions

- when should tenant hub switch from compatibility context to `/me/context` by default?
- should auth tokens remain sessionStorage-based, or should backend rely fully on HTTP-only cookies?
- should each route declare public/protected metadata rather than relying on shared prefix lists?
- should raw query-param tenant resolution remain supported outside local development?
- should parent be a first-class tenant role or a derived guardian relationship?
- should current `/admin` paths be renamed to `/company-admin`, or should path migration wait until backend-aligned release packaging?
- should tenant `owner` remain distinct from `company_admin`, or should it be folded away from tenant hub entirely?

## Profile Workstream

A dedicated profile planning document exists:

```text
./TENANT_ROLE_PROFILES_PLAN.md
```

Current status:

- Phase 1 shared profile/settings: complete
- Phase 2 student profile: complete
- Phase 3 instructor profile: complete
- later admin/parent profile phases still pending

- Frontend wiring started: `tenantModel` is now consumed in app context, `/student/courses` branches for academic tenants, and `/course-player` requests class-scoped student course detail via `groupId`.

- Academic student frontend now has dedicated `/student/classes` and `/student/classes/:classId` routes, plus a class-first `/student` dashboard branch driven by `tenantModel`.

- Student task frontend wiring started: `/student/quizzes` and `/student/submissions` now consume generic `/student/tasks`, which works across both `course_center` and `academic` tenants.

- Student notes/messages backend-mode cleanup: `/student/notes` is now explicit deferred state, and `/student/messages` shows real support-request inbox data instead of mock chat threads.

- Academic student dashboard now consumes real `/student/home` and `/student/reminders` data for next session, urgent tasks, attendance, and reminders instead of placeholder academic panels.

- Instructor academic frontend wiring started: `/classes` and `/classes/:classId` now switch to academic-class backend reads in `academic` tenants, with read-only class subjects, timetable, and attendance summary.

- Company-admin academic class creation started on `/classes`: in `academic` tenants, company admins can now create academic classes there, and hierarchy settings point them to the classes workspace.

- Company-admin academic class detail management started on `/classes/:classId`: in `academic` tenants, company admins and tenant owners can now manage the academic class roster and subject assignments there, while instructors remain read-only on the same surface.

- Academic timetable management started on `/classes/:classId`: in `academic` tenants, company admins and tenant owners can now schedule and edit academic sessions from the class detail timetable section, while instructors still see the timetable in read-only mode.

- Academic session workspace started on `/classes/:classId/sessions/:sessionId`: instructors, company admins, and tenant owners can now open a dedicated session view with bulk attendance marking plus real homework and activity creation/listing on top of the academic backend APIs.

- Academic session editing/review flow started on `/classes/:classId/sessions/:sessionId`: homework and activities can now be edited in place, and instructors/admins can inspect homework submissions plus activity responses from the same session workspace.

- Company-admin academic reporting started on `/classes/:classId`: academic class detail now consumes `/academic-classes/:id/report` and shows class-level attendance, homework, activity, quiz, and per-student summary metrics instead of relying on placeholder reporting.

- Parent portal wiring started: backend now exposes guardian-linked `/parent/children` and `/parent/children/:studentId/summary`, and tenant hub `/parent` plus `/parent/children` now consume those real linked-child summaries instead of static demo data.

- Parent schedule/messages wiring started: backend now exposes `/parent/schedule` and `/parent/messages`, and tenant hub parent schedule/messages pages now consume linked-child session and support-request data instead of mock lists.
