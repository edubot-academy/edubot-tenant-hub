import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Search, Bookmark, Highlighter, StickyNote, BookOpen, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/student/notes")({
  head: () => ({ meta: [{ title: "QuestLMS — Notes & Bookmarks" }] }),
  component: NotesPage,
});

type Entry = {
  id: string;
  kind: "note" | "highlight" | "bookmark";
  course: string;
  lesson: string;
  body: string;
  time: string;
  color?: string;
};

const seed: Entry[] = [
  { id: "1", kind: "highlight", course: "Cognitive Psychology", lesson: "Working Memory", body: "The phonological loop has a capacity of roughly 2 seconds of speech.", time: "2h ago", color: "bg-yellow-200 dark:bg-yellow-900/40" },
  { id: "2", kind: "note", course: "Organic Chemistry II", lesson: "Nucleophilic Substitution", body: "Remember: SN1 = carbocation intermediate; SN2 = one-step backside attack.", time: "Yesterday" },
  { id: "3", kind: "bookmark", course: "Calculus", lesson: "Chain Rule", body: "Lesson 6 · 14:32", time: "2 days ago" },
  { id: "4", kind: "highlight", course: "Modern History", lesson: "Cold War", body: "The Cuban Missile Crisis lasted 13 days in October 1962.", time: "3 days ago", color: "bg-pink-200 dark:bg-pink-900/40" },
  { id: "5", kind: "note", course: "Cognitive Psychology", lesson: "Attention", body: "Selective attention ≠ divided attention. Cocktail party effect is the classic example.", time: "5 days ago" },
  { id: "6", kind: "bookmark", course: "Spanish", lesson: "Pretérito vs Imperfecto", body: "Lesson 12 · 03:18", time: "1 week ago" },
];

const filters = [
  { key: "all", label: "All", icon: BookOpen },
  { key: "note", label: "Notes", icon: StickyNote },
  { key: "highlight", label: "Highlights", icon: Highlighter },
  { key: "bookmark", label: "Bookmarks", icon: Bookmark },
];

function NotesPage() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const items = seed.filter((e) => (filter === "all" || e.kind === filter) && (e.body + e.course + e.lesson).toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell>
      <TopBar title="Notes & Bookmarks" subtitle="Everything you saved while learning" />

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-card border-2 border-border rounded-2xl px-4 chunky-shadow">
          <Search className="size-4 text-foreground/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your notes…"
            className="bg-transparent outline-none flex-1 py-3 text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => {
          const Icon = f.icon;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black border-2 inline-flex items-center gap-2 transition-all ${
                active ? "bg-primary text-primary-foreground border-foreground chunky-shadow" : "bg-card border-border hover:-translate-y-0.5"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((e) => {
          const Icon = e.kind === "note" ? StickyNote : e.kind === "highlight" ? Highlighter : Bookmark;
          return (
            <article key={e.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-8 grid place-items-center rounded-xl bg-muted">
                    <Icon className="size-4 text-primary" strokeWidth={2.5} />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{e.course}</p>
                    <p className="font-black text-sm">{e.lesson}</p>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-muted text-foreground/40">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className={`mt-3 text-sm font-medium leading-relaxed rounded-xl px-3 py-2 ${e.color ?? "bg-muted/50"}`}>
                {e.body}
              </p>
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40 mt-3">{e.time}</p>
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
