Build a single-page instructor dashboard implementing the selected "Gamified hybrid pro" direction (Duolingo + Kahoot vibes, light theme with bold green/purple/yellow accents, chunky shadows, bouncy reveals).

## Scope (this turn)
Frontend-only, single route `/` on TanStack Start. No backend, no auth, no data layer — mock data inline. This is a design build, not a functional LMS yet.

## Design tokens (src/styles.css)
Add to `@theme`:
- `--color-primary: #58CC02` (Duolingo green)
- `--color-secondary: #46178F` (Kahoot purple)
- `--color-accent: #FFC800` (streak yellow)
- `--color-background: #F7F9FB`
- Fonts: Inter (sans, weights 400/600/800) + JetBrains Mono (mono)
- Keyframes: `float`, `bounce-in`
- Utility classes: `.chunky-shadow`, `.chunky-button-primary`, `.chunky-button-secondary` (4px hard down-shadow → press translateY)

Load Google Fonts in `src/routes/__root.tsx` head.

## Components (src/components/dashboard/)
- `Sidebar.tsx` — logo "QuestLMS", nav (Home active, Classes, Quiz Bank, Marketplace), bottom "Teacher Goal" XP card
- `TopBar.tsx` — greeting "Good morning, Prof. Aris", streak count + flame, league/XP avatar pill
- `LaunchQuizHero.tsx` — purple chunky card with 6-digit PIN, "START NOW" button, floating accent square
- `QuickActions.tsx` — 3 chunky action tiles (Create Lesson, Post Update, Set Weekly Challenge)
- `ClassCard.tsx` — cover image, students badge, title, XP progress bar, avg streak, avatar stack
- `ActiveClasses.tsx` — grid of 2 ClassCards (Cognitive Psychology, Organic Chemistry II)
- `Leaderboard.tsx` — top-3 students with rank colors, XP mono numbers, streak flames
- `MilestoneCard.tsx` — purple "The Marathoner" badge card with Send Reward CTA

## Page assembly
Replace `src/routes/index.tsx` content with the dashboard layout: sidebar + main (top bar, hero+quick-actions row, then 8/4 split of Active Classes + Leaderboard/Milestone). Use lucide-react icons for nav/actions (Home, BookOpen, Library, Store, Sparkles, Megaphone, Trophy, Crown, Flame).

## Images
Use `imagegen` (fast tier) for placeholders:
- 2 class cover images (psychology, chemistry) — 400×200
- 3 student avatars + 1 professor avatar — 256×256
Saved to `src/assets/`, imported as ES6.

## Head/SEO
Set title "QuestLMS — Instructor Dashboard" and meta description in route head().

## Out of scope (later turns)
Auth, real data, other routes (Classes, Quiz Bank), live quiz flow, student-side views, Lovable Cloud setup. Will offer next steps after this lands.