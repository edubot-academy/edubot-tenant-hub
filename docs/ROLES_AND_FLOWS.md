# Roles & Flows — Tenant Hub

## Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        TENANT HUB                               │
│                                                                 │
│   ┌─────────┐    ┌───────────────┐                             │
│   │  owner  │ ▶  │ company_admin │  (ops surface)              │
│   └─────────┘    └───────────────┘                             │
│        │                 │                                      │
│        │         ┌───────▼──────┐                              │
│        │         │  assistant   │  (ops surface)               │
│        │         └──────────────┘                              │
│        │                                                        │
│        │    ┌────────────┐   ┌─────────┐   ┌────────┐         │
│        └──▶ │ instructor │   │ student │   │ parent │         │
│             └────────────┘   └─────────┘   └────────┘         │
│                         (playful surface)                       │
└─────────────────────────────────────────────────────────────────┘

owner ⊃ company_admin ⊃ assistant  (privilege superset)
owner also gains student + parent portal read access
```

---

## Authentication & Context Load Flow

```
User visits tenant URL
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  fetchPublicTenantContext                             │
│  GET /tenant-context/resolve?host=<hostname>          │
│  → stores tenant branding & feature flags             │
│  → user = null, permissions = []                      │
└───────────────────┬───────────────────────────────────┘
                    │ No token / no cookie
                    ▼
            ┌──────────────┐
            │  /auth page  │  (login)
            └──────┬───────┘
                   │ Credentials submitted
                   ▼
            POST /auth/login
                   │
                   ▼
        ┌──────────────────────────────────────────────┐
        │  fetchCompatibilityAppContext                 │
        │  GET /auth/profile      → user info           │
        │  GET /companies/workspaces → workspace list   │
        │                                               │
        │  Select active workspace:                     │
        │  1. URL ?tenantId / ?tenant override          │
        │  2. Saved tenantStore (localStorage)          │
        │  3. workspaceState.active from backend        │
        │  4. First tenant workspace in list            │
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
                    normalizeRole(workspace.role)
                               │
               ┌───────────────┴───────────────┐
               │ known tenant role?             │
               ▼ yes                  no ▼
         return as-is        warn + fallback to "student"
               │
               ▼
        context.activeRole  (used for ALL routing & gating)
```

---

## Route Access Gate Flow (every navigation)

```
User navigates to <pathname>
        │
        ▼
  isPublicRoute(pathname)?
  /auth, /invite, /reset-password, /live-quiz-join
        │
   yes ─┤─ no
        │      │
  allow │      ▼
        │  isLoading?  ──yes──▶  render null (spinner)
        │      │ no
        │      ▼
        │  user authenticated?
        │      │ no ──▶  redirect /auth
        │      │ yes
        │      ▼
        │  hasTenantWorkspace?
        │      │ no ──▶  <NoWorkspaceAccess />
        │      │ yes
        │      ▼
        │  canAccessRoute(pathname, activeRole)
        │      │
        │  yes ─┤─ no
        │      │      │
        │  render  <AccessDenied />
        │  page
        ▼
   (Outlet rendered)
```

---

## Role: `owner`

**Surface:** ops  
**Home:** `/`  
**Description:** Full tenant control — billing, branding, integrations, feature flags, plus everything `company_admin` can do.

### What they can do

| Area | Routes | Actions |
|---|---|---|
| Dashboard | `/` | Company overview, seat/storage/AI usage |
| Staff | `/company-admin/staff` | View, invite, edit, remove all staff members |
| Staff detail | `/company-admin/staff/:userId` | Individual member profile & role change |
| Courses | `/courses`, `/courses/:courseId` | Create, edit, delete courses |
| Course Studio | `/course-studio` | Build course content (lessons, quizzes) |
| Billing | `/company-admin/billing` | Manage subscription, invoices, seats |
| Integrations | `/company-admin/integrations` | Connect third-party tools (LTI, Zapier, etc.) |
| Branding | `/company-admin/branding` | Logo, colors, display name |
| Feature Flags | `/company-admin/features` | Toggle AI, gamification, parent portal, live quiz |
| Hierarchy | `/company-admin/hierarchy` | Organizational structure |
| Onboarding | `/onboarding` | Initial tenant setup wizard |
| Trial Requests | `/trial-requests` | Review & approve trial sign-ups |
| Grading | `/grading` | Grade student submissions |
| Quiz Bank | `/quiz-bank` | Manage question bank |
| Live Quiz Host | `/live-quiz-host` | Host real-time quizzes |
| AI Generator | `/ai-generator` | Generate content with AI |
| AI Grading | `/ai-grading` | AI-assisted grading |
| Marketplace | `/marketplace` | Browse & import course templates |
| Student portal | `/student/*` | Read-only access to student views |
| Parent portal | `/parent/*` | Read-only access to parent views |
| Assistant area | `/assistant/*` | Full assistant access |
| Classes | `/classes`, `/classes/:id/sessions/:id` | Manage all classes |
| Calendar | `/calendar` | Full calendar view |
| Notifications | `/notifications` | Notifications |
| Settings | `/settings` | Account & workspace settings |

### Flow: Inviting a staff member

```
Owner → /company-admin/staff
  │
  ▼
Click "Invite" button
  │
  ▼
Fill form: email, name, role (company_admin | instructor | assistant | student | parent)
  │
  ▼
POST /companies/{id}/invitations
  │
  ▼
Invitation email sent to user
  │
  ▼
User clicks link → /invite/:token
  │
  ▼
Account created / linked → user appears in staff list
```

---

## Role: `company_admin`

**Surface:** ops  
**Home:** `/`  
**Description:** Day-to-day tenant management. No access to billing, branding, integrations, or feature flags (those are owner-only).

### What they can do

| Area | Routes | Actions |
|---|---|---|
| Dashboard | `/` | Company overview |
| Staff | `/company-admin/staff`, `/company-admin/staff/:userId` | View, invite, manage staff |
| Courses | `/courses`, `/courses/:courseId` | Create, edit, delete courses |
| Course Studio | `/course-studio` | Build course content |
| Trial Requests | `/trial-requests` | Review trial sign-ups |
| Grading | `/grading` | Grade submissions |
| Quiz Bank | `/quiz-bank` | Manage question bank |
| Live Quiz Host | `/live-quiz-host` | Host quizzes |
| AI Generator | `/ai-generator` | AI content generation |
| AI Grading | `/ai-grading` | AI-assisted grading |
| Marketplace | `/marketplace` | Browse course templates |
| Assistant area | `/assistant/*` | Full assistant access |
| Classes | `/classes`, `/classes/:id/sessions/:id` | Manage classes |
| Calendar | `/calendar` | Calendar |
| Notifications | `/notifications` | Notifications |
| Settings | `/settings` | Settings |

### What they CANNOT do (vs owner)
- `/company-admin/billing` — subscription & invoices
- `/company-admin/branding` — logo & colors
- `/company-admin/integrations` — third-party tools
- `/company-admin/features` — feature flag toggles

---

## Role: `assistant`

**Surface:** ops  
**Home:** `/`  
**Description:** Support role. Handles grading, moderates discussions, and generates reports. Cannot manage courses or staff.

### What they can do

| Area | Routes | Actions |
|---|---|---|
| Dashboard | `/` | Assistant overview |
| Grading | `/assistant/grading` | Grade student submissions |
| Discussions | `/assistant/discussions` | Moderate discussion boards |
| Reports | `/assistant/reports` | View operational reports |
| AI Generator | `/ai-generator` | AI content generation |
| AI Grading | `/ai-grading` | AI-assisted grading |
| Calendar | `/calendar` | Calendar |
| Notifications | `/notifications` | Notifications |
| Settings | `/settings` | Settings |

### Flow: Grading a submission

```
Assistant → /assistant/grading
  │
  ▼
List of pending submissions
  │
  ▼
Click submission → grade form
  │
  ▼
Enter score + feedback
  │
  ▼
PATCH /submissions/:id  { score, feedback }
  │
  ▼
Submission marked graded, student notified
```

---

## Role: `instructor`

**Surface:** playful  
**Home:** `/`  
**Description:** Core teaching role. Manages their own classes and students, creates content, runs assessments.

### What they can do

| Area | Routes | Actions |
|---|---|---|
| Dashboard | `/` | Class schedule, quick actions, leaderboard |
| Classes | `/classes`, `/classes/:classId` | View & manage assigned classes (academic model) |
| Sessions | `/classes/:classId/sessions/:sessionId` | Manage individual sessions, attendance |
| Groups | `/groups`, `/groups/:groupId` | View & manage course groups (course_center model) |
| Students | `/instructor/students`, `/instructor/students/:userId` | View enrolled students, profiles |
| Course Studio | `/course-studio` | Build and edit courses |
| Courses | `/courses`, `/courses/:courseId` | View courses |
| Assignments | `/instructor/assignments` | Create & track assignments |
| Grading | `/grading` | Grade student work |
| Quiz Bank | `/quiz-bank` | Create & manage quiz questions |
| Live Quiz Host | `/live-quiz-host` | Host real-time quizzes |
| AI Generator | `/ai-generator` | Generate course content with AI |
| AI Grading | `/ai-grading` | AI-assisted grading |
| Discussions | `/instructor/discussions` | Manage discussion boards |
| Direct Messages | `/instructor/messages` | Message individual students |
| Group Messages | `/instructor/group-messages` | Message entire groups |
| Announcements | `/instructor/announcements` | Post announcements to classes |
| Trial Requests | `/trial-requests` | View trial sign-ups |
| Office Hours | `/instructor/office-hours` | Set & manage office hours |
| Calendar | `/calendar` | Full calendar |
| Analytics | `/instructor/analytics` | Student performance analytics |
| Marketplace | `/marketplace` | Browse course templates |
| Profile | `/instructor/profile` | Public profile |
| Notifications | `/notifications` | Notifications |
| Settings | `/settings` | Settings |

### Tenant model variations

| `tenantModel` | Change |
|---|---|
| `course_center` | Nav "Classes" entry renamed to "Groups" and routes to `/groups` instead of `/classes` |
| `academic` | Nav "Classes" stays; Course Studio demoted to after Analytics in nav order |

---

### Groups (`/groups`, `/groups/:groupId`)

Available only when `tenantModel = "course_center"`. The nav item "Classes" is relabeled "Groups" and points to `/groups`.

#### Group delivery modes

A group has a `deliveryMode` field that controls which detail view is rendered at `/groups/:groupId`:

| `deliveryMode` | Description | Detail view |
|---|---|---|
| `group` | Standard multi-student group | `CourseCenterGroupBackend` — sessions tab + students tab |
| `individual` | 1-on-1 group (one student per group) | `IndividualGroupDetailPage` — full single-student view |

#### Group detail — what is shown

**Both modes:**
- Group info card: code, status, start/end dates, timezone, location, seat limit
- Recurring schedule pills (e.g. Mon 10:00–11:00) from `scheduleBlocks`, if set
- Default meeting link (Zoom / Google Meet / custom) from `meetingProvider` + `meetingUrl`, if set
- Assigned instructor name + email, if set

**`group` (multi-student) mode — `/groups/:groupId` → `CourseCenterGroupBackend`:**
- Stats: student count, avg course progress %, completed sessions, upcoming sessions
- **Sessions tab:** full session list with status badge; actions per card: Edit, Mark complete ✓, Cancel ✗, Reopen ↩; "Schedule session" button
- **Students tab:** enrolled students with per-student progress bar; Add student / Remove student

**`individual` (1-on-1) mode — `/groups/:groupId` → `IndividualGroupDetailPage`:**
- Stats: completed, scheduled, makeup, total sessions
- Student card: name, email, enrollment date, course progress %, links to student profile; Remove button
- Enroll student button (when slot is empty)
- Sessions list sorted chronologically: title, time, live join link, activity tags, per-session homework & activity progress; actions per card: Edit, Mark complete ✓, Cancel ✗, Reopen ↩
- Progress summary: session completion bar, homework submission bar

#### Group detail — instructor actions

| Action | Where | API call |
|---|---|---|
| Add session | "Add session" button (header + sessions section) | `POST /group-sessions` |
| Edit session (title, times, status, notes) | "Edit" button on session card → dialog | `PATCH /group-sessions/:id` |
| Mark session complete | Green "Done" button on scheduled session card | `PATCH /group-sessions/:id { status: "completed" }` |
| Cancel session | Ban icon on scheduled session card | `PATCH /group-sessions/:id { status: "cancelled" }` |
| Reopen session | "Reopen" on completed/cancelled session card | `PATCH /group-sessions/:id { status: "scheduled" }` |
| Enroll student | "Enroll student" button (individual mode) | `POST /enrollments/enroll` |
| Remove student | ✕ on student card / student row | `DELETE /enrollments/groups/:groupId/students/:userId` |

#### Flow: Managing a 1-on-1 group

```
Instructor → /groups  (nav: "Groups")
  │
  ▼
List of all groups (cards showing code, course, student count, start date, status)
  │
  ▼
Click group with deliveryMode = "individual"
  │
  ▼
/groups/:groupId  →  IndividualGroupDetailPage
  │
  ├── Group info card
  │     code · status · start/end dates · timezone · location
  │     Recurring schedule pills + meeting link (if set)
  │
  ├── Student card
  │     If enrolled: name · email · enrolled date · progress %
  │       [View profile] [✕ Remove]
  │     If empty: "Enroll student" CTA → select from staff list
  │       POST /enrollments/enroll { userId, courseId, groupId }
  │
  ├── Sessions list (sorted by date)
  │     Each card:  title · time range · live link · activity tags
  │                 [Edit] [✓ Done] [✗ Cancel]  (when scheduled)
  │                 [Edit] [↩ Reopen]            (when completed/cancelled)
  │     "Add session" → dialog { title, startsAt, endsAt, notes }
  │       POST /group-sessions
  │
  └── Progress summary
        Session completion bar
        Homework submission bar
```

#### Flow: Managing a regular (multi-student) group

```
Instructor → /groups
  │
  ▼
Click group with deliveryMode = "group"
  │
  ▼
/groups/:groupId  →  CourseCenterGroupBackend
  │
  ├── Group info card (code, dates, schedule, instructor, meeting link)
  │
  ├── Stats: students · avg progress · completed · upcoming
  │
  ├── Sessions tab  [default]
  │     "Schedule session" button → dialog { title, startsAt, endsAt, notes }
  │     Session cards:
  │       [Edit]  [✓]  [✗]  per scheduled session
  │       [Edit]  [↩]       per completed/cancelled session
  │
  └── Students tab
        Progress bar per student
        [Add student] → select from staff list → POST /enrollments/enroll
        [✕] remove student → DELETE /enrollments/groups/:id/students/:userId
```

### Flow: Running a Live Quiz

```
Instructor → /live-quiz-host
  │
  ▼
Select quiz from quiz bank
  │
  ▼
Click "Start session"
  │
  ▼
Students join via /live-quiz-join?code=XXXX
  │
  ▼
Host advances questions (real-time)
  │
  ▼
Results shown on leaderboard
  │
  ▼
Session saved → scores recorded
```

### Flow: Hosting a session with attendance

```
Instructor → /classes/:classId/sessions/:sessionId
  │
  ▼
Session detail view
  │
  ▼
Mark attendance: present / absent / late per student
  │
  ▼
PATCH /sessions/:sessionId/attendance
  │
  ▼
Attendance saved; visible to company_admin & owner in reports
```

---

## Role: `student`

**Surface:** playful  
**Home:** `/`  
**Description:** Enrolled learner. Consumes course content, completes assignments, earns XP and badges.

### What they can do

| Area | Routes | Actions |
|---|---|---|
| Dashboard | `/` | Learning streak, upcoming classes, achievements |
| Discover | `/discover` | Browse available courses |
| My Courses | `/student/courses` | Enrolled course list |
| Classes (academic) | `/student/classes`, `/student/classes/:classId` | Class schedule & details |
| Quizzes | `/student/quizzes` | Take quizzes |
| Submissions | `/student/submissions` | View submitted assignments & grades |
| Notes | `/student/notes` | Personal notes |
| Vocab Review | `/student/vocab-review` | Flashcard-style vocabulary drills |
| Direct Messages | `/student/messages` | Message instructors |
| Announcements | `/student/announcements` | View class announcements |
| Discussions | `/student/discussions` | Participate in discussions |
| AI Tutor | `/ai-tutor` | Chat with AI tutor |
| Study Plan | `/ai-study-plan` | AI-generated personalized study plan |
| XP | `/xp` | Experience points history |
| Leagues | `/leagues` | Competitive league standings |
| Badges | `/badges` | Earned badge collection |
| Certificates | `/student/certificates` | Completion certificates |
| Leaderboard | `/student/leaderboard` | Class leaderboard |
| Course Player | `/course-player` | Play lesson content |
| Calendar | `/calendar` | Class schedule |
| Profile | `/student/profile` | Profile settings |
| Notifications | `/notifications` | Notifications |
| Settings | `/settings` | Settings |

### Tenant model variations

| `tenantModel` | Change |
|---|---|
| `course_center` | Nav item: "My Courses" → `/student/courses` |
| `academic` | Nav item: "My Courses" renamed to "Classes" → `/student/classes` |

### Flow: Completing a lesson

```
Student → /student/courses  (or /student/classes in academic mode)
  │
  ▼
Select enrolled course → course detail
  │
  ▼
Click lesson → /course-player?lessonId=XXX
  │
  ▼
Video / reading / interactive content loads
  │
  ▼
PATCH /progress/:lessonId  { completed: true }
  │
  ▼
XP awarded → badge check → leaderboard updated
  │
  ▼
Next lesson unlocked
```

### Flow: Taking a quiz

```
Student → /student/quizzes
  │
  ▼
Select quiz
  │
  ▼
Answer questions (timer if set)
  │
  ▼
Submit → POST /quiz-submissions
  │
  ▼
→ /quiz-results?submissionId=XXX
  │
  ▼
Score shown, correct answers revealed
  │
  ▼
XP awarded, instructor notified
```

---

## Role: `parent`

**Surface:** playful  
**Home:** `/`  
**Description:** Guardian view. Monitors their child's progress, communicates with instructors, manages billing for the child's enrollment.

### What they can do

| Area | Routes | Actions |
|---|---|---|
| Dashboard | `/` | Children overview, upcoming sessions |
| Children | `/parent/children` | List of linked children, progress summaries |
| Schedule | `/parent/schedule` | Children's class schedule |
| Messages | `/parent/messages` | Message instructors |
| Group Chat | `/parent/group-chat/:groupId` | Group chat for a class |
| Billing | `/parent/billing` | View invoices, payment history |
| Calendar | `/calendar` | Shared calendar |
| Notifications | `/notifications` | Notifications |
| Settings | `/settings` | Settings |

### Flow: Checking a child's progress

```
Parent → /parent/children
  │
  ▼
List of linked children (GET /guardian/children)
  │
  ▼
Click child → progress detail
  │
  ▼
Shows: courses enrolled, grades, attendance, upcoming sessions
  │
  ▼
Parent can message instructor from this view
  │
  ▼
POST /messages  { to: instructorId, re: childId, body: "..." }
```

---

## Permissions Map (backend-derived)

These permissions come from the backend workspace record and are used in addition to role-based route guards for fine-grained UI control.

| Backend permission flag | Maps to `AppPermission` | Primarily held by |
|---|---|---|
| `canManageTenant` / `canManageSettings` | `tenant.manage` | owner, company_admin |
| `canViewReports` / `canViewOperationalReports` | `tenant.reports.view` | owner, company_admin, assistant |
| `canManageMembers` | `members.manage` | owner, company_admin |
| `canManageCourses` / `canCoordinateGroups` | `courses.manage`, `groups.manage` | owner, company_admin, instructor |
| `canTeachAssignedSessions` / `canViewOperationalSessions` | `sessions.manage` | instructor, assistant |
| `canManageAssignedAttendance` | `attendance.manage` | instructor |
| `canSupportOperations` / `canViewStudentSupportContext` | `assistant.support` | assistant |
| `canViewGuardianContext` | `parent.portal` | parent |

---

## Route Access Matrix

`✓` = allowed, `–` = denied

| Route prefix | owner | company_admin | assistant | instructor | student | parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/company-admin` | ✓ | ✓ | – | – | – | – |
| `/company-admin/billing` | ✓ | – | – | – | – | – |
| `/company-admin/branding` | ✓ | – | – | – | – | – |
| `/company-admin/integrations` | ✓ | – | – | – | – | – |
| `/company-admin/features` | ✓ | – | – | – | – | – |
| `/owner` | ✓ | – | – | – | – | – |
| `/onboarding` | ✓ | ✓ | – | – | – | – |
| `/assistant` | ✓ | ✓ | ✓ | – | – | – |
| `/instructor` | ✓ | ✓ | – | ✓ | – | – |
| `/course-studio` | ✓ | ✓ | – | ✓ | – | – |
| `/classes` | ✓ | ✓ | – | ✓ | – | – |
| `/groups` | ✓ | ✓ | – | ✓ | – | – |
| `/courses` | ✓ | ✓ | – | ✓ | – | – |
| `/grading` | ✓ | ✓ | ✓ | ✓ | – | – |
| `/quiz-bank` | ✓ | ✓ | – | ✓ | – | – |
| `/live-quiz-host` | ✓ | ✓ | – | ✓ | – | – |
| `/ai-generator` | ✓ | ✓ | ✓ | ✓ | – | – |
| `/ai-grading` | ✓ | ✓ | ✓ | ✓ | – | – |
| `/marketplace` | ✓ | ✓ | – | ✓ | – | – |
| `/trial-requests` | ✓ | ✓ | – | ✓ | – | – |
| `/student` | ✓ | – | – | – | ✓ | – |
| `/discover` | ✓ | – | – | – | ✓ | – |
| `/ai-tutor` | ✓ | – | – | – | ✓ | – |
| `/ai-study-plan` | ✓ | – | – | – | ✓ | – |
| `/xp` / `/leagues` / `/badges` | ✓ | – | – | – | ✓ | – |
| `/course-player` | ✓ | ✓ | – | ✓ | ✓ | – |
| `/parent` | ✓ | – | – | – | – | ✓ |
| `/calendar` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/notifications` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/settings` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Workspace Switcher Flow

Users with membership in multiple tenants can switch between them.

```
TopBar → workspace switcher dropdown
  │
  ▼
List of AppWorkspace items (type: "tenant" | "platform")
  │
  ▼
User selects workspace
  │
  ▼
tenantStore.set(companyId)  [localStorage]
  │
  ▼
queryClient.invalidateQueries(["app-context"])
  │
  ▼
fetchCompatibilityAppContext re-runs
  │
  ▼
activeRole updated → route guard re-evaluated
  │
  ▼
Redirect to homeForRole(activeRole) = "/"
```

---

## Tenant Model Effect on UI

Two tenant operating models change nav labels and route targets for `instructor` and `student`.

```
tenantModel = "course_center"          tenantModel = "academic"
─────────────────────────────          ────────────────────────
Instructor:                            Instructor:
  nav: "Classes"                         nav: "Groups" (renamed)
  Studio: 3rd in nav                     Studio: after Analytics

Student:                               Student:
  "My Courses" → /student/courses        "Classes" → /student/classes
```

---

## Adding a New Role — Checklist

```
1. src/lib/roles.tsx
   ├── Add to Role union type
   ├── Add to ALL_ROLES array
   ├── Add ROLE_CONFIG entry (surface, home, nav items)
   └── Update roleFromPath() if new URL namespace

2. src/lib/app-context.tsx
   └── Add to KNOWN_TENANT_ROLES  ← TypeScript error if forgotten

3. src/lib/route-access.ts
   └── Update ROLE_ACCESS_RULES with allowed prefixes

4. Backend
   └── Add membership role value to company members API
```
