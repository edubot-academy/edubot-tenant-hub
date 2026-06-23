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

## [1.4.2] - 2026-06-23

### Added

- Instructor certificate approvals now support an inline certificate preview modal and an editable “student name on certificate” field before approval, so instructors can verify the rendered output and adjust the displayed learner name without leaving the certificate queue.
- Owner/company-admin certificate student cards now support an inline certificate preview modal at any time, plus an editable “student name on certificate” field before issuing. After a successful issue action, the preview modal opens automatically so admins can immediately verify the rendered certificate.

### Changed

- Instructor certificate approval requests now optionally send `studentFullName` to `POST /certificates/:certificateId/approve` when an instructor edits the displayed certificate name. This backend field is optional and approval still works without it.
- Admin certificate issue requests now also optionally send `studentFullName` to `POST /courses/:courseId/certificates/issue` when the issuer overrides the displayed certificate name. This backend field is intended to be optional; existing issue flows continue to work without it.
- Signature upload inputs in the admin and instructor certificate workspaces now also accept WEBP files in addition to PNG, JPEG, and SVG.

### Fixed

- Group detail enrollment in backend mode once again only offers `active` student members as enrollable candidates. A recent regression had started showing invited and suspended members in the picker, which was inconsistent with the rest of the LMS enrollment flows.
- Certificate signature uploads are now normalized client-side before upload in both the admin and instructor certificate workspaces. PNG, WEBP, and SVG signatures are flattened onto a white background and re-uploaded as PNG to avoid black-background artifacts in certificate preview/rendering pipelines that do not preserve transparency reliably.

## [1.4.1] - 2026-06-23

### Fixed

- Course approve, submit-for-approval, and publish actions now call the correct dedicated backend endpoints (`PATCH /courses/:id/status` and `PATCH /courses/:id/publish`) instead of the general metadata update endpoint. Previously all three operations were routed to `PATCH /courses/:id`, which uses `whitelist: true` validation and silently stripped the `status` and `isPublished` fields, making the buttons do nothing.
- Submit-for-approval now sends `status: "pending"` (the value the backend accepts) instead of `"pending_approval"`.
- Publish button is now hidden when a course is already published, since the backend has no unpublish endpoint (previously a broken toggle was shown).
- Added `useUpdateTenantCourseStatus` and `usePublishTenantCourse` mutation hooks; removed `status` and `isPublished` from the general `useUpdateTenantCourse` body to prevent silent no-ops.

## [1.4.0] - 2026-06-23

### Added

- Course detail pages in backend mode now expose role-aware course actions for editing metadata, submitting for approval, approving, publishing/unpublishing, and jumping into course content editing for video courses.

### Changed

- Added a shared `useUpdateTenantCourse` mutation hook for `PATCH /courses/:id`, with course list/detail cache invalidation so course status and publish-state actions update the UI immediately.

### Fixed

- Instructor access to course management now consistently respects `courses.manage`: the course library create action, course detail management actions, Course Studio route access, and the instructor sidebar entry are all hidden or blocked when that permission is missing.

## [1.3.1] - 2026-06-23

### Changed

- Company-admin/owner certificate management now keeps the course workspace focused on course settings and student certificate actions only; the experimental custom-certificate flow was removed from the tenant hub UI.
- Admin certificate issuance now uses the course students workspace data source in the per-student certificate panel, matching the main app more closely and exposing a direct student selector/filter above the certificate cards.

### Fixed

- Student selection in the admin certificate workspace is now available directly in the tenant hub certificate page, so admins can target an individual learner without relying on the removed ad hoc issue form.
- Per-student certificate cards now stay aligned with the latest workspace student records, including certificate status and `publicId` data returned by the course students workspace endpoint.

## [1.3.0] - 2026-06-23

### Added

- Tenant certificate management workspace at `/certificates` for owners and company admins, including course-scoped certificate settings, template preview, signature/logo uploads, certificate registry, and a per-student certificate action workspace.
- Instructor certificate workspace at `/instructor/certificates` with course selection, status filters, approval/rejection actions, summary metrics, and signature upload support.
- Public tenant routes for certificate verification and download at `/certificates/:publicId/verify` and `/certificates/:publicId/download`.
- Shared certificate API layer in `src/lib/certificates-api.ts` covering settings, listing, issue/approve/reject/revoke/regenerate actions, preview HTML, verification lookup, and PDF download.
- Certificate navigation entries for company-admin, owner, and instructor roles.

### Changed

- Student certificate cards now open tenant-owned verification and download flows instead of sending users directly to backend URLs, keeping the experience inside the tenant hub.
- Certificate list handling now tolerates both paginated and array-shaped backend responses for `/courses/:courseId/certificates`, making the frontend compatible with the in-progress backend rollout.
- Route-access rules now treat certificate verification as public and allow authenticated certificate downloads for student, instructor, company-admin, and owner roles.
- Certificate settings preview flow now preserves an exact backend-rendered preview when available and falls back to the local preview canvas when the preview endpoint is unavailable.

### Fixed

- Owner/company-admin certificate settings now leave edit mode after a successful save instead of remaining in editing state.
- Drawn signature uploads now preserve transparency instead of flattening onto a white background before upload.
- Certificate summary metrics and the admin student certificate workspace no longer become incorrect when a status filter is active; both now derive from the unfiltered certificate set.
- Certificate React Query cache keys now include pagination parameters, preventing filtered or differently-sized list responses from overwriting each other.
- Certificate settings view mode now actually locks the non-template controls as read-only instead of allowing silent edits outside edit mode.
- Student, instructor, and admin certificate verify/download actions now rely on `publicId` consistently, so actions stay available even when legacy `downloadUrl` or `verificationUrl` fields are missing.
- RU and KY locale bundles now include the `revoked` instructor certificate filter label.

## [1.2.0] - 2026-06-21

### Added

- Student assessment flow with new routes for introduction, goal selection, active attempt, and results, backed by `/assessment-tests/start`, current-attempt lookup, question progression, answer submission, result retrieval, and attempt abandonment.
- Admin assessment workspace at `/admin/assessment` for assistants, company admins, and owners with tabs for analytics, tests, questions, learning paths, and student results.
- Assessment dashboard entry points in student navigation and the student home screen, including a resumable assessment banner, a quick-action card, and localized assessment copy in EN/RU/KY.

### Changed

- `i18n` now merges dedicated assessment locale bundles into the shared translation resources, and common navigation labels now expose an `assessment` entry across supported locales.
- `/admin` now acts as a parent layout route so nested admin pages like `/admin/assessment` render correctly instead of being redirected away.
- `vite.config.ts` now applies the Nitro `vercel` preset only when `VERCEL=1`, reducing local build and runtime coupling to Vercel-specific output.

### Fixed

- Auth and route-access guards now wait for refetching backend context before redirecting, preventing false unauthenticated redirects when a cookie-backed session is still being resolved.
- Early brand hydration now validates cached tenant colors before injecting CSS variables, avoiding invalid cached values from polluting the initial theme.
- Student-only course player access now redirects authenticated non-student backend users to `/` instead of falling through to the prototype player.
- Member-profile queries now require a finite numeric `userId`, preventing invalid backend requests from staff and student detail screens.
- Shared `Textarea` now supports tab insertion for multiline authoring flows, and LMS dialogs that edit long-form prompts/curriculum now use it with resizable multiline inputs.
- Student search in `VideoEnrollDialog` is now debounced before querying the backend, reducing unnecessary request churn while typing.

## [1.1.0] - 2026-06-19

### Added

- `VideoEnrollDialog` component for enrolling individual students into a course by searching by name or email; accessible from the course detail page.
- `useUploadCourseCover` mutation hook — uploads a cover image for a course via `POST /courses/:id/upload-cover` and invalidates the course list and detail queries.
- `useCourseEnrolledStudents` query hook — fetches the enrolled student roster for a course via `GET /enrollments/courses/:id/students`.
- `useUnenrollFromCourse` mutation hook — removes a student from a course via `DELETE /enrollments/:courseId/unenroll/:userId`.
- `useGuardianChildren` query hook — fetches a guardian's linked student records via `GET /companies/:companyId/guardians/:userId/students`.
- `BACKEND_BOOT_CONTEXT` — neutral backend context used while the real app-context query is in-flight so the app never enters prototype mode during boot.
- `hasResolvedContext` flag on `useAppContext` return value; consumers can gate flows that must not render before the first context response arrives.
- `AppBootError` screen in the root shell with localized retry and go-home actions; shown when the app context query fails.

### Changed

- Course library create-course form now includes a **course type** selector (`offline` / `online_live`) and a **cover image** upload field; the cover is uploaded in a second step after course creation.
- Course cards in the library now display the cover image (with a subtle zoom on hover), a type icon (map-pin for offline, radio for online live, video for video), and the active group count.
- `ActiveClasses` dashboard widget now shows the course cover image as a full-bleed background with a gradient overlay; falls back to the brand-tinted placeholder when no cover is set.
- Group detail view add-session dialog now pre-fills `startsAt` and `endsAt` from the group's `scheduleBlocks` by computing the next upcoming occurrence of the earliest scheduled day.
- Grading page now shows **status filter pills** (All / Submitted / Approved / Rejected / Needs Revision) and an inline review panel with score and comment fields that calls `useReviewSubmission`.
- Trial requests page is fully localized (EN/RU/KY) and ships a **new trial request creation dialog** rendered via `createPortal` with fields for student name, parent name, email, phone, and preferred date/time.
- Quiz bank "New" button respects the `ai` feature flag — it is visually disabled with a tooltip when the AI feature is off, and shows a toast if clicked.
- Teaching, group detail, and course detail locale bundles (EN/RU/KY) significantly expanded to cover new dialog copy, toast messages, and filter labels.
- Route access rules now include `/discover`, `/ai-tutor`, `/ai-study-plan`, `/xp`, `/leagues`, `/badges`, and `/student` for the `owner` and `company_admin` roles.
- Auth app context no longer unauthenticated-falls-through to prototype mock data during workspace initialization; `fetchCompatibilityAppContext` now sets the correct tenant post-login.

### Security

- `AuthRedirectGate` no longer short-circuits on a non-null `tokenStore` value: a stale access token left in storage after server-side session expiry no longer prevents redirect to `/auth`.
- `RouteAccessGate` now gates on `context.user` alone (not `!tokenStore.get() && !context.user`), so a session with a stale token but a null resolved user is correctly treated as unauthenticated.
- Tenant workspace selection now excludes workspaces whose role is not a recognised tenant role (`owner`, `company_admin`, `instructor`, `assistant`, `student`, `parent`). Platform-level roles (`admin`, `superadmin`) are not tenant roles and no longer grant entry to the tenant hub — affected users see `NoWorkspaceAccess`.
- When a user has no valid tenant workspace, `activeRole` is a fixed `"student"` safe default instead of the user's platform role. This prevents an elevated platform role from leaking into the app context and being read by role-conditional UI outside `RouteAccessGate`.

### Fixed

- App boot in backend mode no longer briefly renders prototype demo data before the first app-context response arrives; the neutral `BACKEND_BOOT_CONTEXT` is used until the query resolves.

- CSRF token retry now sends the freshly-fetched token instead of the stale cookie: `readCsrfToken` now prefers the in-memory token over the cookie, so a cookie present from a previous session no longer shadows the refreshed value during the retry request.
- Grading page pending count is now derived from a dedicated `status: "submitted"` query (`pendingQuery.data.total`) rather than filtering the currently-visible page. The count is now accurate when any other status filter is active.
- Grading submission row no longer resets in-progress score and comment fields on background refetches. The initialisation effect now depends on `item.submissionId` (item identity) instead of `item.score` and `item.reviewComment`, so only switching rows or opening a new row triggers a reset.
- Course player video resume now defers the `currentTime` assignment to the `loadedmetadata` event when the video element's `readyState` is below `HAVE_METADATA`. Previously the seek was silently discarded because it fired immediately after element mount before the browser had parsed the source.
- Quiz bank "Launch" no longer silently swallows a `recordUse` API error after navigation; an error toast is now shown via the mutation's `onError` callback.

## [1.0.0] - 2026-06-18

First public release of the Edubot tenant hub. Covers the multi-role LMS frontend, tenant-aware theming, feature-flagged navigation, live quiz flows, group management, and instructor homework grading.

### Added

#### Auth and App Context

- Backend auth flow for sign-in, logout, forgot-password, reset-password, invite acceptance, setup-account, and account activation.
- Tenant-aware app context with workspace resolution, active role, permissions, feature flags, and optional `/me/context` integration.
- Public-route allowlist, access-denied screen, no-workspace screen, and onboarding flow.
- Authenticated API client with tenant headers, CSRF retry support, auth-expired events, and raw-response support via 

- Public auth pages now use a shared branded shell with improved desktop/mobile layout, tenant-aware visual treatment, integrated language switching, and consistent styling across sign-in, forgot-password, reset-password, invite, setup-account, and activation flows.
- Auth forms were refreshed with larger controls, clearer hierarchy, and in-card footer/help treatment to better fit viewport height on public pages.`apiFetchRaw`.

- Nested auth routes under `/auth`, including `/auth/forgot-password`, now render correctly because the `/auth` route acts as a parent layout and renders child route content when matched.
- The desktop auth layout now keeps the informational left panel aligned to the login card height instead of collapsing shorter than the form card.

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
