# QuestLMS — Master Task List

## Phase 1: Foundation (Infrastructure)
- [ ] **i18n Setup**: Install `i18next` + `react-i18next`, configure with `ky` as default, `ru`, `en`
- [ ] **Locale Files**: Create `src/locales/{ky,ru,en}/{common,dashboard,course,quiz,auth,settings}.json`
- [ ] **Language Switcher**: Dropdown in TopBar, persists to `localStorage`, updates `<html lang>`
- [ ] **Dark Mode**: Theme provider hook (`light`/`dark`/`system`), toggle in TopBar, `.dark` CSS overrides
- [ ] **Theme CSS**: Add dark mode tokens to `styles.css` (background, card, foreground, border, muted overrides)
- [ ] **Ops Mode Tokens**: Add `data-surface="ops"` CSS variables for pro dashboards (tighter spacing, smaller radii, muted shadows, monospace numerals)
- [ ] **Translate Existing UI**: Convert all current dashboard strings to `t('key')` calls
- [ ] **Font Setup**: Ensure Cyrillic support (Inter covers Cyrillic, good for ky/ru)

## Phase 2: Global Shell
- [ ] **Role Switcher**: Component in sidebar to switch between all 6 roles (mock/stored in localStorage)
- [ ] **Dynamic Sidebar Nav**: Nav items change per role (student, instructor, admin, owner, etc.)
- [ ] **Dynamic TopBar**: Adapts greeting, stats, and actions per role
- [ ] **Route Layout**: Create layout route with sidebar + topbar wrapper for all dashboards

## Phase 3: Student Dashboard (`/student` — Playful Mode)
- [ ] **Today Hero**: Next live session with countdown timer, join button (15min before unlock)
- [ ] **My To-Do**: Filter chips — Open / Overdue / Submitted / Needs Revision / Completed
- [ ] **Course Progress Cards**: XP bars, completion %, next lesson preview
- [ ] **Materials Carousel**: Resources + recordings per course
- [ ] **Certificates Badge Wall**: Earned certificates with share/download
- [ ] **Streak Calendar**: Duolingo-style 7-day grid with flame icons
- [ ] **XP & League Bar**: Current XP, league rank, next milestone
- [ ] **Quiz Arena Card**: Quick-access to live quiz battles (Kahoot-style PIN entry)
- [ ] **AI Tutor Widget**: Floating chat or card for AI homework help
- [ ] **Student Leaderboard**: Class/peer ranking

## Phase 4: Instructor Dashboard v2 (`/` — Playful Mode)
- [ ] **Setup Checklist**: Chunky card for new instructors (admin setup steps)
- [ ] **Insights Row**: Active students, sessions this week, pending grading, avg completion (stat tiles)
- [ ] **Today's Sessions**: Live join + class roster per session
- [ ] **Pending Grading Queue**: Submissions needing review with quick actions
- [ ] **At-Risk Students**: Students with overdue/needs_revision tasks (alert cards)
- [ ] **Student Leaderboard**: Per-class or global
- [ ] **Quick Actions**: Launch quiz, create assignment, send announcement
- [ ] **Milestones**: Recent class achievements

## Phase 5: Parent/Guardian Dashboard (`/parent` — Playful-Lite)
- [ ] **Child Selector**: If multiple children enrolled
- [ ] **Progress Recap**: Overall completion, recent grades, attendance
- [ ] **Milestone Feed**: What child achieved this week
- [ ] **To-Do Summary**: Child's overdue tasks (read-only)
- [ ] **Upcoming Sessions**: Calendar view of child's schedule
- [ ] **Payment/Billing Card**: If applicable (future: Stripe integration)
- [ ] **Messages**: Communication from instructors

## Phase 6: Assistant Dashboard (`/assistant` — Pro Mode)
- [ ] **Grading Queue**: All submissions assigned to assistant, filter by course/status
- [ ] **Discussion Moderation**: Flagged comments / reported posts
- [ ] **Student Messages**: Help desk tickets from students
- [ ] **Analytics Snapshot**: Grading velocity, response times

## Phase 7: Company Admin Dashboard (`/admin` — Pro Mode)
- [ ] **User Management Table**: CRUD for instructors, students, assistants (TanStack Table)
- [ ] **Course Catalog Builder**: Create/edit courses, assign instructors
- [ ] **Organization Settings**: SSO config, branding, custom domain
- [ ] **Integration Hub**: Zoom, Google Classroom, Slack webhooks
- [ ] **Reports & Analytics**:
  - [ ] Enrollment trends (Recharts line chart)
  - [ ] Completion rates by course (bar chart)
  - [ ] Instructor performance metrics
  - [ ] Revenue dashboard (if paid courses)
- [ ] **Audit Log**: Activity history for compliance

## Phase 8: Owner HQ (`/owner` — Pro Mode)
- [ ] **Multi-Tenant Overview**: All organizations/tenants summary
- [ ] **Billing & Plans**: Stripe subscription management (future)
- [ ] **White-Label Settings**: Custom domains, logos, colors per tenant
- [ ] **Global Analytics**: Platform-wide KPIs (MAU, revenue, retention)
- [ ] **System Health**: Uptime, error rates, support tickets
- [ ] **Feature Flags**: Toggle features per tenant

## Phase 9: Deep Screens (Cross-Role)
- [ ] **Course Studio** (`/studio/course/:id`): Rich-text editor + AI content generation
- [ ] **Course Player** (`/course/:id/learn`): Lesson viewer with video, quizzes, notes
- [ ] **Live Quiz Host** (`/quiz/host/:pin`): Kahoot-style real-time quiz with student responses
- [ ] **Live Quiz Join** (`/quiz/join/:pin`): Student entry with nickname, real-time answers
- [ ] **Quiz Results** (`/quiz/results/:id`): Leaderboard, per-question analytics, export
- [ ] **Assignment Grading** (`/grading/:id`): Rubric-based grading with comments
- [ ] **Student Profile** (`/student/:id`): Progress timeline, skill graph, certificates
- [ ] **Calendar** (`/calendar`): Shared calendar with sessions, deadlines, live events
- [ ] **Notifications Center**: Unified notification inbox
- [ ] **Settings** (`/settings`): Profile, password, notifications, language, theme

## Phase 10: Gamification Engine (Frontend Mock → Backend)
- [ ] **XP System**: Points for completing lessons, quizzes, streaks
- [ ] **Streak Tracking**: Consecutive days of activity
- [ ] **Leagues**: Weekly competitive ranking (Bronze → Diamond)
- [ ] **Badges & Achievements**: Unlockable milestones
- [ ] **Skill Graph**: Mastery visualization (circular/spider chart)

## Phase 11: AI Features (Frontend Mock → Backend)
- [ ] **AI Content Generator**: Generate quiz questions, lesson summaries
- [ ] **AI Grading Assistant**: Auto-grade objective questions, suggest rubric scores
- [ ] **AI Tutor Chat**: Conversational homework help
- [ ] **AI Study Plan**: Personalized learning paths based on weak areas

## Phase 12: Backend Integration (Future — Lovable Cloud)
- [ ] **Auth**: Supabase Auth with role-based access (6 roles)
- [ ] **Database Schema**: Users, courses, lessons, quizzes, submissions, progress, achievements
- [ ] **RLS Policies**: Row-level security per role
- [ ] **Real-time**: Live quiz WebSocket, notifications
- [ ] **File Storage**: Video uploads, document attachments
- [ ] **Email Notifications**: Deadline reminders, grading complete, streak alerts

---

**Status Legend:**
- `[-]` Not started
- `[~]` In progress
- `[x]` Complete
