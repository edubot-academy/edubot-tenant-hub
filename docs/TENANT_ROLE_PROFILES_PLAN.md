# Tenant Role Profiles Integration Plan

## Purpose

This document defines the profile workstream for `edubot-tenant-hub` and `edubot-learning-backend`.

The tenant hub currently has multiple profile-related screens, but most of them are still static or prototype-driven. The backend already has many building blocks, especially `User`, `UserSerializer`, student portal endpoints, company member endpoints, skills, certificates, guardians, and tenant people profiles. The missing piece is a clean set of profile view-model contracts that the frontend can consume without manually composing many endpoints per page.

## Current Frontend Profile Surfaces

### 1. Shared account/profile settings

Frontend file:

```text
src/routes/settings.tsx
```

Current UI areas:

- Profile/account form
- Security
- Language
- Appearance
- Notifications

Current state:

- Mostly static form values.
- Should become the shared profile/settings surface for all tenant roles.

### 2. Instructor profile

Frontend file:

```text
src/routes/instructor.profile.tsx
```

Current UI areas:

- Instructor identity card
- Avatar/initials
- Name/title
- About/bio
- Stats
- Social links
- Courses taught
- Credentials
- Reviews

Current state:

- Static data.
- Should be backed by an instructor profile view model.

### 3. Student profile

Frontend file:

```text
src/routes/student.profile.tsx
```

Current UI areas:

- Student identity card
- XP/streak/badges/courses
- Skill graph
- Certificates
- Activity timeline

Current state:

- Static arrays.
- Should be backed by a student profile aggregator.

### 4. Parent child profile summaries

Frontend file:

```text
src/routes/parent.children.tsx
```

Current UI areas:

- Child cards
- Streak
- Average grade/progress
- Course count
- Attendance

Current state:

- Static children.
- Backend has guardian entities, but parent portal access model is not complete.

### 5. Admin staff/member profiles

Frontend files:

```text
src/routes/admin.staff.tsx
src/components/admin/StaffMembers.tsx
```

Current UI areas:

- Staff member list
- Invites
- Role/status/joined date

Current state:

- Static members/invites in route.
- Backend already has company members and person profile endpoints.

## Backend Readiness Summary

| Area | Backend readiness | Notes |
| --- | ---: | --- |
| Shared profile read | 70% | `User` and `UserSerializer` already expose most fields. |
| Shared profile edit | 30% | Existing update DTO only supports `fullName`, `password`, `phoneNumber`. |
| Settings/preferences | 35% | Student notification settings exist, but global preferences are missing. |
| Instructor profile | 55% | Tenant person profile and instructor dashboard exist, but public profile contract is missing. |
| Student profile | 70% | Student portal, certificates, progress, and skills exist; aggregator is missing. |
| Parent profile | 25% | Guardian entity exists, but parent portal access model is missing. |
| Admin staff profile | 75% | Company members and person profile are mostly ready. |
| Gamification profile data | 30% | Skills exist; XP/streak/badges are not clearly centralized. |

## Backend Building Blocks Already Available

### User profile base

Existing backend entity:

```text
src/users/user.entity.ts
```

Already available fields:

- `id`
- `email`
- `fullName`
- `role`
- `title`
- `avatar`
- `phoneNumber`
- `notifyByEmail`
- `notifyByWhatsApp`
- `notifyByTelegram`
- `notifyForPayments`
- `bio`
- `socialLinks`
- `yearsOfExperience`
- `expertiseTags`

Existing serializer:

```text
src/common/serializers/user.serializer.ts
```

Already exposes:

- safe identity fields
- profile fields
- notification flags
- instructor-style fields such as `yearsOfExperience` and `expertiseTags`

Existing auth/profile endpoints:

```text
GET /auth/profile
PATCH /auth/update/:id
```

Current limitation:

- `PATCH /auth/update/:id` DTO is too narrow for the tenant hub settings/profile UI.

### Student portal

Existing student endpoints include:

```text
GET /student/home
GET /student/courses
GET /student/courses/:courseId
GET /student/progress
GET /student/progress/summary
GET /student/certificates
GET /student/notification-settings
PATCH /student/notification-settings
GET /student/notifications
GET /student/reminders
GET /student/sessions/upcoming
GET /student/recordings
GET /student/resources
```

Existing skills endpoints:

```text
GET /skills
GET /skills/me/progress
```

Useful for student profile:

- courses count
- lessons/progress
- certificates
- skills/progress percent
- notifications

Current gaps:

- student profile aggregator
- XP total
- streak
- badges count
- activity timeline
- grade/year field

### Company people and staff

Existing tenant/company endpoints:

```text
GET /companies/:id/members
GET /companies/:id/people/:userId/profile
GET /companies/:id/members/resolve
POST /companies/:id/members
POST /companies/:id/invitations
PATCH /companies/:id/members/:userId/role
DELETE /companies/:id/members/:userId
```

Useful for admin/staff profile:

- role
- status
- invited/accepted dates
- onboarding status
- member identity
- person progress/work context

Current gaps:

- avatar URL in member list
- phone number in member list
- last active date
- assigned courses/groups workload summary
- pending grading count
- explicit suspend/reactivate contract if desired

### Instructor/person profile

Existing endpoint:

```text
GET /companies/:id/people/:userId/profile
```

Useful for instructor profile:

- person identity
- roles
- title
- avatar key
- bio
- summary
- courses
- groups
- students
- attendance/homework summaries

Existing instructor dashboard endpoint:

```text
GET /companies/:id/instructor-dashboard
```

Current gaps:

- dedicated instructor profile contract
- public profile settings
- credentials
- course review aggregation for instructor-taught courses
- signed avatar URL

### Parent/guardian

Existing entity:

```text
src/companies/student-guardian.entity.ts
```

Existing operator endpoints:

```text
GET /companies/:id/students/:studentId/guardians
POST /companies/:id/students/guardians
```

Current gaps:

- parent login/access model
- parent profile endpoint
- parent children endpoint
- child summary endpoint limited to linked children
- parent-safe visibility rules

## Target Shared Profile Contract

Recommended endpoints:

```text
GET /profile/me
PATCH /profile/me
PATCH /profile/me/preferences
```

### `GET /profile/me` response

```ts
type UserProfileBase = {
  id: number;
  fullName: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  title?: string | null;

  platformRole: string;
  tenantRole: 'owner' | 'company_admin' | 'assistant' | 'instructor' | 'student' | 'parent';
  tenantStatus: 'active' | 'invited' | 'suspended';

  locale: 'ky' | 'ru' | 'en';
  timezone: string;
  joinedAt: string;

  socialLinks?: {
    website?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    instagram?: string | null;
    telegram?: string | null;
  };

  notificationPreferences: {
    emailDigest: boolean;
    announcements: boolean;
    grades: boolean;
    messages: boolean;
    marketing: boolean;
    notifyByEmail: boolean;
    notifyByWhatsApp: boolean;
    notifyByTelegram: boolean;
    notifyForPayments: boolean;
  };
};
```

### `PATCH /profile/me` accepted fields

```ts
type UpdateProfileMeDto = {
  fullName?: string;
  title?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  socialLinks?: Record<string, string | null>;
  yearsOfExperience?: number | null;
  expertiseTags?: string[];
};
```

### `PATCH /profile/me/preferences` accepted fields

```ts
type UpdateProfilePreferencesDto = {
  notifyByEmail?: boolean;
  notifyByWhatsApp?: boolean;
  notifyByTelegram?: boolean;
  notifyForPayments?: boolean;
  locale?: 'ky' | 'ru' | 'en';
  timezone?: string;
};
```

Implementation note:

- `locale`, `timezone`, `appearancePreferences`, and `displayName` may require new user-level columns or a `user_preferences` table.
- For first implementation, return tenant/default locale and timezone when user-level fields do not exist.

## Target Instructor Profile Contract

Recommended endpoints:

```text
GET /profile/instructor/me
PATCH /profile/instructor/me
GET /instructors/:instructorId/public-profile
```

### `GET /profile/instructor/me` response

```ts
type InstructorProfile = {
  user: UserProfileBase;

  publicProfile: {
    headline?: string | null;
    bio?: string | null;
    expertiseTags: string[];
    yearsOfExperience?: number | null;
    credentials: Array<{
      id: string | number;
      title: string;
      issuer?: string | null;
      year?: string | number | null;
    }>;
    socialLinks: UserProfileBase['socialLinks'];
    isPublic: boolean;
  };

  stats: {
    totalStudents: number;
    activeStudents: number;
    totalCourses: number;
    activeCourses: number;
    averageCourseRating?: number | null;
    reviewCount: number;
    certificatesIssued?: number;
  };

  courses: Array<{
    id: number;
    title: string;
    courseType: 'video' | 'offline' | 'online_live';
    status: string;
    studentsCount: number;
    ratingAverage?: number | null;
    ratingCount?: number;
  }>;

  courseReviews: Array<{
    id: number;
    studentName: string;
    rating: number;
    comment: string;
    createdAt: string;
    courseTitle?: string | null;
  }>;
};
```

Important product decision:

- Do not add direct instructor reviews unless intentionally reintroduced.
- Use course reviews from instructor-taught courses for the first profile implementation.

## Target Student Profile Contract

Recommended endpoint:

```text
GET /student/profile
```

### `GET /student/profile` response

```ts
type StudentProfile = {
  user: UserProfileBase;

  learner: {
    gradeLevel?: string | null;
    groupNames: string[];
    joinedAt: string;
  };

  stats: {
    xp: number;
    streakDays: number;
    badgesCount: number;
    coursesCount: number;
    certificatesCount: number;
    averageProgress: number;
    attendanceRate?: number | null;
    homeworkCompletionRate?: number | null;
  };

  skills: Array<{
    key: string;
    label: string;
    value: number;
  }>;

  certificates: Array<{
    id: number;
    title: string;
    courseTitle: string;
    issuedAt: string | null;
    grade?: string | null;
    certificateUrl?: string | null;
    verificationId?: string | null;
    verificationUrl?: string | null;
  }>;

  activityTimeline: Array<{
    id: string | number;
    type: 'quiz_completed' | 'badge_earned' | 'homework_submitted' | 'course_joined' | 'certificate_issued';
    title: string;
    score?: string | null;
    createdAt: string;
    courseTitle?: string | null;
  }>;
};
```

First backend version can return safe defaults for missing gamification data:

```ts
{
  xp: 0,
  streakDays: 0,
  badgesCount: 0,
  activityTimeline: []
}
```

## Target Parent Profile Contract

Recommended endpoints:

```text
GET /parent/profile
PATCH /parent/profile
GET /parent/children
GET /parent/children/:studentId/summary
```

### Parent access model decision

Recommended first version:

- Parent/guardian access should be derived from `student_guardians`.
- Do not require `parent` to be a full tenant staff role at first.
- A guardian user should only see linked children.

### `GET /parent/children` response

```ts
type ParentChildrenResponse = {
  user: UserProfileBase;

  guardian: {
    relationship?: string | null;
    preferredChannel?: 'email' | 'phone' | 'telegram' | 'whatsapp' | null;
    canReceiveProgressUpdates: boolean;
    canReceiveAttendanceUpdates: boolean;
    canReceiveHomeworkUpdates: boolean;
    consentStatus: 'pending' | 'approved' | 'revoked';
  };

  children: Array<{
    studentId: number;
    fullName: string;
    avatarUrl?: string | null;
    initials: string;
    gradeLevel?: string | null;
    groups: Array<{
      id: number;
      name: string;
      courseTitle: string;
    }>;
    stats: {
      averageProgress: number;
      streakDays: number;
      activeCourses: number;
      attendanceRate: number;
      homeworkCompletionRate?: number | null;
    };
    riskStatus?: 'good' | 'watch' | 'at_risk';
  }>;
};
```

## Target Admin Staff Profile Contract

Existing endpoints can be reused first:

```text
GET /companies/:companyId/members
GET /companies/:companyId/people/:userId/profile
```

Optional future endpoints:

```text
GET /companies/:companyId/members/:userId
PATCH /companies/:companyId/members/:userId/profile
PATCH /companies/:companyId/members/:userId/status
```

### Staff member profile shape

```ts
type StaffMemberProfile = {
  id: number;
  userId: number;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;

  roles: Array<'owner' | 'company_admin' | 'assistant' | 'instructor' | 'student'>;
  primaryRole: 'owner' | 'company_admin' | 'assistant' | 'instructor' | 'student';
  membershipStatus: 'active' | 'invited' | 'suspended';

  joinedAt?: string | null;
  invitedAt?: string | null;
  acceptedAt?: string | null;
  lastActiveAt?: string | null;

  workload?: {
    assignedCourses: number;
    assignedGroups: number;
    activeStudents: number;
    pendingGrading: number;
  };

  permissions: Record<string, boolean>;
};
```

## Frontend Implementation Plan

### Phase 1 — Shared settings profile

Status: Complete on June 6, 2026.

Backend:

```text
GET /profile/me
PATCH /profile/me
PATCH /profile/me/preferences
```

Frontend:

- Add `src/lib/profile/profile-api.ts`.
- Add React Query hooks:
  - `useMyProfile()`
  - `useUpdateMyProfile()`
  - `useUpdateMyPreferences()`
- Replace static values in `src/routes/settings.tsx`.
- Keep all visible text Kyrgyz/Russian-ready through i18n.

Exit criteria:

- Settings page loads real user profile.
- User can update profile fields without changing role/tenant identity.
- Notification preferences update through backend.

### Phase 2 — Student profile [Done]

Backend:

```text
GET /student/profile
```

Frontend:

- Add `useStudentProfile()`.
- Replace static arrays in `src/routes/student.profile.tsx`.
- Show loading, error, and empty states.
- Keep missing gamification values as safe defaults until backend supports them.

Exit criteria:

- Student profile shows real account, progress, skills, and certificates.
- Note: Phase 2 uses real backend-derived gamification header stats (`xp`, `streak`, `badges`) from existing activity and skill progress data. A dedicated gamification domain model remains future work and is not a Phase 2 blocker.

### Phase 3 — Instructor profile

Backend:

```text
GET /profile/instructor/me
PATCH /profile/instructor/me
```

Frontend:

- Add `useInstructorProfile()`.
- Replace static data in `src/routes/instructor.profile.tsx`.
- Use course reviews, not direct instructor reviews, unless product decision changes.

Exit criteria:

- Instructor profile shows real public profile, course stats, and courses taught.

### Phase 4 — Admin staff profile

Backend:

```text
GET /companies/:companyId/members
GET /companies/:companyId/people/:userId/profile
```

Frontend:

- Replace static members and invites in `src/routes/admin.staff.tsx`.
- Use member profile endpoint for details/modal if implemented.

Exit criteria:

- Admin staff screen shows real members/invitations.

### Phase 5 — Parent children profile

Backend:

```text
GET /parent/children
GET /parent/children/:studentId/summary
```

Frontend:

- Replace static child cards in `src/routes/parent.children.tsx`.
- Only show children linked to the authenticated guardian.

Exit criteria:

- Parent sees only linked children and safe summary data.

## Recommended Backend Execution Order

1. Create `ProfileModule`:
   - `GET /profile/me`
   - `PATCH /profile/me`
   - `PATCH /profile/me/preferences`
2. Add `GET /student/profile` aggregator.
3. Add `GET /profile/instructor/me` and `PATCH /profile/instructor/me`.
4. Improve `GET /companies/:id/members` response only if frontend needs richer staff list data.
5. Define parent access model and then implement `GET /parent/children`.

## Important UX/Product Decisions

- `/me/context` should stay lightweight and should not include full profile timelines, certificates, or reviews.
- Tenant sidebar should not add an extra duplicate workspace/profile card unless product/UX requires it.
- Profile display text must be Kyrgyz/Russian-ready.
- Profile editing must never allow users to change their own tenant role or platform role.
- Public instructor profiles should be opt-in through `isPublic` or tenant setting.
- Parent/guardian must only see linked children.

## Open Backend Questions

- Should user-level locale/timezone live on `users`, `user_preferences`, or tenant membership settings?
- Should display name be added separately from `fullName`?
- Should avatars remain private signed URLs or become tenant-visible media assets?
- Should credentials be stored as JSON on user profile first or normalized into an `instructor_credentials` table?
- Should student grade/year be added to enrollment, user profile, or student profile table?
- Should XP/streak/badges be implemented as a real gamification module or derived from progress/events first?
- Should parent access be a real tenant role or derived from `student_guardians`?

## Next Concrete Task

Start with shared profile/settings because it supports every role and removes the largest amount of static data safely.

Implementation target:

```text
Backend:
GET /profile/me
PATCH /profile/me
PATCH /profile/me/preferences

Frontend:
src/lib/profile/profile-api.ts
src/routes/settings.tsx
```
