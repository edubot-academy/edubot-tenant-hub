# Tenant Operating Model And Academic Domain Plan

## Purpose

This document defines how the product should support two different tenant operating models without overloading one backend entity with two meanings.

The current backend primary learning model is:

```text
course -> course_group -> session
```

That model works well for course businesses, but it is not the right primary structure for schools and universities where the academic class exists independently of any one course.

This plan recommends:

- keep the current model for course-center tenants
- add an academic model for school and university tenants
- choose the model per tenant through configuration
- keep shared lower-level learning primitives where they truly match

## Recommendation

Do **not** make `course_group` mean both:

- delivery cohort for course centers
- academic class for schools/universities

That creates semantic drift in:

- roster ownership
- timetable ownership
- attendance ownership
- advisor/homeroom workflows
- parent reporting
- student progression
- gradebook/reporting

Instead, use one tenant-level operating model flag and support two domain shapes.

## Tenant Operating Model

Add tenant configuration such as:

```text
tenantModel = "course_center" | "academic"
```

Possible future refinement:

```text
academicLevel = "school" | "university"
```

This configuration should drive:

- navigation
- terminology
- enabled modules
- dashboard composition
- entity relationships
- reporting surfaces
- workflow priority in tenant hub

## Model A: Course Center

Use the current backend shape as the primary teaching model:

```text
Course
  -> CourseGroup
    -> Session
```

Use cases:

- language centers
- bootcamps
- short-term academies
- tutoring centers
- corporate training
- recurring course businesses

Why it fits:

- the course is the primary object
- the group is one delivery batch or cohort of that course
- sessions belong naturally to the group

Examples:

- `IELTS Intensive`
- `IELTS Intensive Evening Group`
- sessions every Tue/Thu at 18:00

## Model B: Academic

Add an academic domain model where the class exists independently of any one course.

Recommended primary shape:

```text
AcademicClass
  -> AcademicClassCourse
    -> Session
Course
```

Where:

- `AcademicClass` is the persistent class/cohort/homeroom/section
- `Course` is the subject or academic course
- `AcademicClassCourse` links a class to a course and carries subject-teaching context
- `Session` belongs to `academicClass + course`

Use cases:

- schools
- universities
- colleges
- academic lyceums

Examples:

- `Grade 10-A`
- `Mathematics`
- `Grade 10-A + Mathematics + Teacher X`
- timetable sessions for that class-course

## Why Current `course -> group -> session` Is Not Enough For Academic Tenants

It forces this pattern:

- `10-A Math`
- `10-A Physics`
- `10-A English`

as separate groups, even though the real academic class is `10-A`.

This causes:

1. Roster duplication
2. Timetable fragmentation
3. Attendance ambiguity
4. Weak class-level reporting
5. No first-class advisor/homeroom model
6. Harder parent and student views for academic institutions

## Shared Concepts Across Both Models

These concepts can remain shared if the linkage is explicit:

- `Course`
- `Session`
- `Attendance`
- `Homework`
- `Submissions`
- `Grades`
- `Notifications`
- `Profile`
- `Certificates` where applicable

The difference is which parent context they belong to.

For example:

- course-center session:
  - `courseGroupId`
- academic session:
  - `academicClassId`
  - `courseId`
  - optionally `academicClassCourseId`

## Proposed Backend Domain Additions For Academic Tenants

### 1. `AcademicClass`

Suggested fields:

- `id`
- `companyId`
- `name`
- `code`
- `gradeLevel` or `yearLevel`
- `academicYear`
- `termSchemaId` or term metadata
- `advisorUserId`
- `timezone`
- `status`

Responsibilities:

- persistent class identity
- class roster ownership
- homeroom/advisor assignment
- class-wide timetable context

### 2. `AcademicClassEnrollment`

Suggested fields:

- `id`
- `academicClassId`
- `studentId`
- `status`
- `enrolledAt`
- `leftAt`

Responsibilities:

- canonical class roster

### 3. `AcademicClassCourse`

Suggested fields:

- `id`
- `academicClassId`
- `courseId`
- `instructorId`
- `term`
- `status`

Responsibilities:

- subject assignment into a class
- instructor ownership for that class-course context

### 4. `Session`

For academic tenants, either:

- extend current session model to support academic linkage, or
- add a thin academic scheduling layer that references the existing session core

Suggested linkage:

- `academicClassId`
- `courseId`
- `academicClassCourseId`

Responsibilities:

- timetable occurrence
- attendance target
- subject meeting

## What To Keep From Current Backend

Keep as-is for `course_center` tenants:

- `Course`
- `CourseGroup`
- `CourseSession`

Do not remove or rewrite this model immediately.

It is still correct for a meaningful tenant segment.

## What To Avoid

Do not:

- rename `CourseGroup` to `Class` globally and assume the problem is solved
- force academic class semantics onto `CourseGroup`
- keep wiring tenant hub deeper around `group = class` for academic tenants

That would create a misleading product model and cost more to undo later.

## Tenant Hub UI Implications

### Course center navigation

Primary objects:

- Courses
- Groups
- Sessions

### Academic navigation

Primary objects:

- Classes
- Courses or Subjects
- Timetable
- Attendance
- Gradebook

This means tenant hub should become operating-model aware.

The current frontend should not assume one universal IA for every tenant.

## Immediate Planning Rule

Until the academic model is explicit:

- do not harden `course_group = class` further in docs or implementation
- keep current Phase 4 LMS work focused on course-center-safe slices
- treat school/university support as an architectural branch, not a naming tweak

## Recommended Migration Path

### Phase A - Configuration

Add tenant configuration:

- `tenantModel`

Expose it through:

- app context
- workspace context
- tenant settings

### Phase B - Preserve course-center flow

Keep current tenants working on:

```text
course -> group -> session
```

No breaking migration required.

### Phase C - Add academic entities

Introduce:

- `AcademicClass`
- `AcademicClassEnrollment`
- `AcademicClassCourse`

Decide whether `Session` is extended or wrapped for academic scheduling.

### Phase D - Tenant hub model-aware UI

Switch dashboards and navigation by `tenantModel`.

Examples:

- `course_center`: Courses/Groups/Sessions first
- `academic`: Classes/Courses/Timetable first

### Phase E - Reporting and attendance alignment

Build:

- class-level reporting
- subject-in-class reporting
- parent/student academic summaries

## Recommended Decision

Adopt:

- per-tenant operating model configuration
- two domain models with shared lower-level primitives

Do not adopt:

- one overloaded `CourseGroup` abstraction trying to mean both delivery group and academic class

## Next Execution Steps

1. Add `tenantModel` to the planning docs and target app context contract.
2. Mark current LMS-core work as `course_center` aligned unless otherwise stated.
3. Define academic backend entities and endpoint candidates before more school/university UI wiring.
4. Revisit `/classes` semantics in tenant hub once the academic model is approved.

- Frontend wiring started: `tenantModel` is now consumed in app context, `/student/courses` branches for academic tenants, and `/course-player` requests class-scoped student course detail via `groupId`.

- Academic student frontend now has dedicated `/student/classes` and `/student/classes/:classId` routes, plus a class-first `/student` dashboard branch driven by `tenantModel`.

- Student task frontend wiring started: `/student/quizzes` and `/student/submissions` now consume generic `/student/tasks`, which works across both `course_center` and `academic` tenants.

- Student notes/messages backend-mode cleanup: `/student/notes` is now explicit deferred state, and `/student/messages` shows real support-request inbox data instead of mock chat threads.

- Academic student dashboard now consumes real `/student/home` and `/student/reminders` data for next session, urgent tasks, attendance, and reminders instead of placeholder academic panels.

- Instructor academic frontend wiring started: `/classes` and `/classes/:classId` now switch to academic-class backend reads in `academic` tenants, with read-only class subjects, timetable, and attendance summary.

- Company-admin academic class creation started on `/classes`: in `academic` tenants, company admins can now create academic classes there, and hierarchy settings point them to the classes workspace.

- Company-admin academic class detail management started on `/classes/:classId`: in `academic` tenants, company admins and tenant owners can now add/remove roster students and assign/remove subjects there. Instructor access to the same academic class detail remains read-only.

- Academic session management started on `/classes/:classId`: in `academic` tenants, company admins and tenant owners can now create and edit timetable sessions directly inside the academic class detail view. Instructor access to the timetable remains read-only until dedicated instructor session workflows are added.

- Dedicated academic session workflow started on `/classes/:classId/sessions/:sessionId`: instructors, company admins, and tenant owners can now manage attendance, create homework, and create activities from a class-scoped academic session workspace instead of treating the timetable as a dead-end list.

- Session-level academic review flow started on `/classes/:classId/sessions/:sessionId`: instructors and admins can now edit homework/activities and review homework submissions plus activity responses inside the same class-scoped session workspace.

- Class-level academic reporting started on `/classes/:classId`: the academic class detail view now exposes backend class-report aggregates and per-student summary rows, which gives company admins a real reporting surface without introducing a separate disconnected report page first.

- Assistant frontend backend-mode cleanup started: `/assistant`, `/assistant/discussions`, and `/assistant/reports` now consume real tenant assistant dashboard/support contracts, while `/assistant/grading` is explicitly deferred until a dedicated grading queue API exists.
- Assistant support case-detail wiring started: `/assistant/discussions` now reads real support note history and can create/update support notes against the tenant support endpoints instead of treating the queue as read-only.
