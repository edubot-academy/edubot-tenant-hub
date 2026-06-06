# Tenant App Boundary And Role Migration Plan

## Purpose

This document defines the ownership boundary between the main app and `edubot-tenant-hub`.

The immediate problem is not only missing backend wiring. The current tenant frontend still mixes:

- platform `admin` and `superadmin`
- tenant `company_admin`
- tenant `owner`
- prototype-only routes that look production-ready but do not yet map to real backend workflows

If that boundary is not cleaned up first, new implementation work will continue to land in the wrong app or under the wrong role semantics.

## Target Ownership Model

### Main app owns

- public marketing and discovery
- public catalog and commerce
- platform authentication entrypoints that are not tenant-specific
- platform `admin`
- platform `superadmin`
- platform-level tenant management
- platform-level analytics, audit, feature flags, and system health
- public certificate verification/download surfaces where public routing matters

### Tenant hub owns

- authenticated tenant workspace shell
- tenant branding-aware login context
- `company_admin`
- `instructor`
- `assistant`
- `student`
- `parent`
- tenant-scoped settings, notifications, communications, learning, scheduling, and operations

## Role Rules

### `company_admin`

This is the tenant administrative role.

Use it for:

- tenant dashboard
- staff and invitations
- tenant billing and subscription views
- tenant branding and settings
- tenant reports
- integrations and API keys
- hierarchy and feature configuration

Do not label this role as generic `admin` in implementation code unless the context is clearly tenant-only and intentionally temporary.

### `admin` and `superadmin`

These are platform roles.

They should stay in the main app.

Do not coerce them into tenant-hub roles during app-context normalization.

### `owner`

This must be resolved explicitly.

Current state:

- tenant hub has an `/owner` route that behaves like a platform HQ surface
- backend role and app ownership do not justify keeping this inside tenant hub by default

Decision rule:

- if `owner` means platform owner, keep it in main app only
- if `owner` means tenant owner, define its backend permissions and explain how it differs from `company_admin`
- if there is no real functional difference, fold tenant `owner` into `company_admin` for tenant hub purposes

Recommended default:

- remove the current `/owner` surface from tenant hub
- keep platform owner/admin work in main app

## Immediate Cleanup Required In Tenant Hub

### 1. Stop platform-admin coercion

Current tenant hub app-context code still treats platform `admin` and `superadmin` as tenant-side roles.

Required change:

- remove normalization that maps platform `admin` or `superadmin` into tenant `owner`
- preserve a clear distinction between platform role and active tenant role

### 2. Rename tenant admin semantics

Current company-admin UI still uses `/admin` route naming and `admin.*` i18n/component namespaces in many places.

Required change:

- rename tenant-admin semantics to `company_admin`
- keep old route aliases only as a transition layer if needed

Recommended naming direction:

- routes: `/company-admin/*` preferred
- components: `components/company-admin/*`
- i18n namespace: `companyAdmin.*`
- docs and copy: `Company Admin`

If route migration is too disruptive immediately, keep `/admin/*` as a temporary path alias but document that it means tenant `company_admin`, not platform admin.

### 3. Remove or relocate `/owner`

Current `/owner` in tenant hub should not survive as-is.

Options:

- remove it and redirect to company-admin home
- move it to main app if it is actually platform scope
- rebuild it later as a true tenant-owner surface if backend permissions justify it

Recommended path:

- remove current tenant-hub `/owner` from release scope

## Page Ownership Matrix

### Keep in tenant hub and implement

- tenant shell, tenant login, app context
- shared profile/settings
- company admin dashboard and operations
- instructor workspace
- assistant workspace
- student workspace
- parent workspace
- tenant notifications, calendar, communications
- tenant AI workflows that operate inside tenant learning flows

### Keep in main app

- main landing/public site
- public catalog if it remains non-tenant scoped
- platform admin dashboards
- platform tenant management
- system-wide analytics and health
- platform-level feature flags and audit center

### Review case-by-case

- certificate download/verification
- marketplace if it becomes cross-tenant or public
- invite/activation entrypoints if they must share one auth host

## Prototype Policy

From this point on, every tenant-hub prototype page must be placed into one of three buckets:

### Bucket A: implement now

The page stays and must be wired to real backend data because the backend exists or is planned immediately.

Examples:

- company admin staff/invites
- company admin billing/integrations/hierarchy
- instructor classes/courses/attendance/grading
- student home/course-player/submissions/notifications
- assistant support dashboards
- parent child summary pages

### Bucket B: defer but keep explicitly marked

The page stays only if it is a planned release surface and is clearly marked as pending backend implementation.

Examples:

- advanced AI pages
- live quiz
- richer communications

### Bucket C: remove

Delete pages that are demo-only, duplicate other app ownership, or have no committed backend path.

Examples:

- platform-owner style tenant-hub pages
- duplicate platform-admin concepts inside tenant hub
- dead-end prototype screens that have no backend contract and no approved roadmap

Initial classification snapshot:

- Remove now:
  - old `/owner` platform-style tenant-hub dashboard surface
  - unused `src/components/owner/*` platform-owner cards and widgets
- Keep and implement now:
  - `company-admin*` routes
  - instructor LMS core routes
  - student home, course-player, submissions, notifications
- Keep but defer:
  - AI generator, AI grading, AI tutor, AI study plan
  - live quiz host/join
  - richer communications surfaces

Expanded route classification:

- Remove or alias only:
  - `/owner`
    - keep only as a redirect alias to `/company-admin`
  - `/admin`
  - `/admin/staff`
  - `/admin/billing`
  - `/admin/integrations`
  - `/admin/hierarchy`
    - keep only as compatibility redirects to canonical `/company-admin/*`

- Keep and implement now: tenant shell and company admin
  - `/`
    - instructor home/dashboard shell
  - `/company-admin`
  - `/company-admin/staff`
  - `/company-admin/billing`
  - `/company-admin/integrations`
  - `/company-admin/hierarchy`
  - `/settings`
  - `/notifications`
  - `/calendar`
  - `/onboarding`

Current status notes:

- `/company-admin/staff` is backend-wired in API mode
- `/company-admin/hierarchy` is backend-wired in API mode through tenant settings
- `/company-admin` is backend-wired in API mode through `/companies/:id/dashboard`
- `/company-admin/billing` is backend-wired in API mode for tenant status, plan, usage, invoice feed, editable payment-method metadata, and plan changes; backend now exposes `billing/subscription`, `billing/usage`, `billing/invoices`, `billing/payment-method`, `billing/plan`, and `billing/payment-method` update, with current invoice rows stored or derived until a real ledger exists
- `/company-admin/integrations` is backend-wired in API mode for truthful CRM/workspace status; webhook, SSO, and API-key actions remain deferred until dedicated contracts exist

- Keep and implement now: instructor LMS core
  - `/classes`
  - `/classes/$classId`
  - `/courses`
  - `/courses/$courseId`
  - `/course-studio`
  - `/grading`
  - `/quiz-bank`
  - `/instructor/assignments`
  - `/instructor/discussions`
  - `/instructor/messages`
  - `/instructor/announcements`
  - `/instructor/office-hours`
  - `/instructor/analytics`
  - `/instructor/students`
  - `/instructor/profile`

- Keep and implement now: student core
  - `/student`
  - `/student/profile`
  - `/student/certificates`
  - `/student/courses`
  - `/student/quizzes`
  - `/student/submissions`
  - `/student/notes`
  - `/student/messages`
  - `/student/leaderboard`
  - `/student/achievements`
  - `/course-player`
  - `/discover`
  - `/quiz-results`
  - `/xp`
  - `/badges`
  - `/leagues`

- Keep and implement now: parent and assistant core
  - `/parent`
  - `/parent/children`
  - `/parent/schedule`
  - `/parent/messages`
  - `/parent/billing`
  - `/assistant`
  - `/assistant/grading`
  - `/assistant/discussions`
  - `/assistant/reports`

- Keep and implement now: auth entrypoints
  - `/auth`
  - `/auth/forgot-password`
  - `/reset-password`
  - `/invite/$token`
  - `/auth/activate/$token`

- Keep but defer explicitly:
  - `/ai-generator`
  - `/ai-grading`
  - `/ai-study-plan`
  - `/ai-tutor`
  - `/live-quiz-host`
  - `/live-quiz-join`
  - `/marketplace`
    - keep only if it stays tenant-scoped; move to main app if it becomes public or cross-tenant

Implementation notes:

- Pages in "implement now" may remain partially wired during transition, but they stay in release scope and must have a backend path.
- Pages in "defer" must be visibly treated as pending work, not production-complete workflow surfaces.
- Pages in "remove or alias only" should not receive new product work.

## Migration Order

### Phase 1

- finalize role ownership model
- stop platform-admin coercion in tenant hub
- decide fate of tenant-hub `/owner`

### Phase 2

- normalize tenant admin semantics to `company_admin`
- update nav, labels, copy, docs, and route guards
- optionally preserve `/admin/*` as transitional URL aliases

### Phase 3

- classify all prototype pages into implement/defer/remove
- remove dead prototype surfaces first

### Phase 4

- implement retained prototype pages in backend-priority order
- company admin
- instructor LMS core
- student portal completion
- parent and assistant depth

## Release Rule

No new tenant-hub production feature should be added until the role/app boundary is clear for that feature.

If a page belongs to platform admin, it goes to the main app.
If a page belongs to a tenant role, it goes to tenant hub.
If ownership is ambiguous, resolve that first and only then implement.
