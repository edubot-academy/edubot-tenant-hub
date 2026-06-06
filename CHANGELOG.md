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

- No unreleased changes.

## [0.1.0] - 2026-06-06

### Added

- Root-level authenticated-route guard for backend mode, with public-route exceptions for auth, invite, reset-password, and live quiz join flows.
- Backend route access now fails closed for unknown protected routes and explicitly allows only current route prefixes by role.
- Sidebar logout action that clears local auth state, clears active tenant state, removes cached app context, and redirects to login.
- Tenant-aware sidebar/mobile branding using resolved tenant name, logo text, logo image, and brand color.
- App API client for authenticated requests, tenant headers, CSRF retry handling, auth-expired events, and token/tenant storage.
- App context provider for resolved tenant, active role, user profile, workspaces, permissions, and feature flags.
- Query-param tenant resolution for local development, including `?tenant=<slug>` and `?tenantId=<id>`.
- Optional future `/me/context` integration behind `VITE_USE_APP_CONTEXT_ENDPOINT=true`.
- Optional cookie-backed session bootstrap via `VITE_AUTH_SESSION_MODE=cookie` or `VITE_USE_COOKIE_AUTH=true`.
- Explicit no-workspace state for authenticated users who do not belong to any tenant workspace.
- Initial versioned changelog for tenant frontend/backend alignment work.

### Changed

- Login page now calls backend `/auth/login` when backend mode is enabled and redirects by active role after context reload.
- Tenant display now reads from resolved app context instead of static tenant presets.
- First render without a token avoids protected context/profile/workspace calls.
- `?tenant=<slug>` no longer expands to `slug.lms.edubot.it.com` unless `VITE_TENANT_QUERY_BASE_DOMAIN` is configured.
- Invite, activation, forgot-password, and reset-password pages no longer show fake successful backend outcomes in backend mode.
- Authenticated users without tenant workspace membership now see a no-workspace access screen instead of demo tenant fallback data.

### Fixed

- Avoided first-render 401 noise from `/auth/profile` and `/companies/workspaces` before login.
- Avoided CORS preflight failure by removing the custom `x-tenant-host` header from tenant resolution.
- Avoided local backend 404 noise by making `/me/context` opt-in until the backend implements it.
- Logout now completes locally and redirects even if backend `/auth/logout` fails.
- `nitro` dev dependency aligned with `@lovable.dev/vite-tanstack-config` peer requirement.
