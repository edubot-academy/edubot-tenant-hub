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

## [1.0.0] - 2026-06-18

First public release of the Edubot tenant hub. Covers the multi-role LMS frontend, tenant-aware theming, feature-flagged navigation, live quiz flows, group management, and instructor homework grading.

### Added

#### Auth and App Context

- Backend auth flow for sign-in, logout, forgot-password, reset-password, invite acceptance, setup-account, and account activation.
- Tenant-aware app context with workspace resolution, active role, permissions, feature flags, and optional `/me/context` integration.
- Public-route allowlist, access-denied screen, no-workspace screen, and onboarding flow.
- Authenticated API client with tenant headers, CSRF retry support, auth-expired events, and raw-response support via `apiFetchRaw`.

#### Student Workspace

- Course list, course detail, course player, class list, class detail, quizzes, submissions, assignments, announcements, discussions, notes, messages, leaderboard, badges, leagues, achievements, certificates, discover, AI tutor, AI study plan, and profile routes.
- Vocabulary review route with spaced-repetition hooks and student access/dashboard support hooks.
- XP celebration overlay and floating `+XP` feedback.

#### Instructor Workspace

- Analytics, announcements, assignments, discussions, messages, office hours, student list/detail, profile, quiz bank, course studio, AI content generation, and AI grading routes.
- Group messages route for broadcasting to enrolled groups.
- Homework detail route at `/instructor/sessions/:sessionId/homework/:homeworkId` with roster review states, summary tiles, rubric scoring, feedback, comments, and CSV export.
- New homework grading hooks: `useHomeworkDetail`, `useHomeworkReviewRoster`, `useReviewRosterSubmission`, `useSubmissionComments`, `useAddSubmissionComment`, `useMyHomeworkSubmission`.

#### Assistant, Parent, and Admin Workspaces

- Assistant overview, grading queue, reports, and support queue flows.
- Parent overview, schedule, children, billing, messages, and group chat routes.
- Staff, billing, branding, features, integrations, hierarchy, students, student detail, and trial requests flows for company admins and owners.

#### Groups and Live Quiz

- Group list, group detail, and group session detail routes with creation and editing dialogs.
- Full-screen live quiz host presentation for lobby, question, reveal, and finish phases.
- Mobile-first live quiz join experience with answer pads, feedback states, and score callouts.

#### Theming, Branding, and Feature Flags

- Secondary and accent tenant colors in app context and head sync.
- Early-head brand cache restore to prevent tenant color flash before hydration.
- Semantic brand token system in `src/lib/brand-tokens.ts` with source and RGB CSS variables.
- Feature-flag-aware sidebar filtering and route gating, including AI feature handling.

#### Navigation and Docs

- Navigation entries for vocabulary review, group messages, students, and trial requests.
- Top-bar search button with `⌘K` hint.
- `docs/ROLE_ARCHITECTURE.md` and `docs/ROLES_AND_FLOWS.md`.

### Changed

- `company-admin/*` routes were promoted to top-level paths such as `/billing`, `/branding`, `/features`, `/hierarchy`, `/integrations`, `/staff`, and `/staff/:userId`.
- Billing i18n keys were renamed from `companyAdminBillingPage.*` to `billingPage.*` across EN/RU/KY locales.
- `TenantBadge` was refactored into a reusable `TenantLogo` component.
- Dashboard and student-facing empty states were refreshed with semantic brand surfaces and clearer visual hierarchy.
- Leaderboard, quiz results, and streak presentation were upgraded with podium-style emphasis.

### Fixed

- Homework grading queries now include `companyId` in query keys, preventing cross-tenant cache leakage.
- Homework review invalidation now refreshes the grading queue with the real `companyId`.
- Submission attachment downloads now use authenticated requests, including Firefox-safe object URL cleanup.
- Homework comment entry prevents duplicate submit-on-Enter while the mutation is pending.
- Homework review blocks invalid `NaN` scores instead of sending bad payloads.
- Assignments group count metric no longer subtracts a removed sentinel value.
- AI routes now redirect away cleanly when the `ai` feature flag is disabled.
- Live quiz reveal screens recover missing `correctIndex` data from the local question set, and small-session finish states render correctly.
- Branding head sync no longer flashes placeholder values while tenant context is loading.
- Legacy brand cache entries are normalized to preserve semantic token consistency before hydration.
- CSRF handling supports in-memory token fallback and avoids false positives on unrelated `403` responses.
- Auth expiry events are deduplicated to avoid duplicate logout toasts and race conditions.
- Billing retries now skip exponential backoff on `4xx` responses.
- Staff and billing mutations now guard against `null` `companyId`.
- Public tenant context no longer falls through to prototype mock data when no backend tenant resolves.
- Tenant name fallback preserves intentional empty-string branding values.
- Staff invite role options and API typings now include the `parent` role.
- Shared logout logic was extracted into `useLogout`.
