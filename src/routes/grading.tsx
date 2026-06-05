import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { ChevronLeft, ChevronRight, MessageSquare, FileText, Save, Send, Paperclip } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/grading")({
  head: () => ({ meta: [{ title: "QuestLMS — Assignment Grading" }] }),
  component: GradingPage,
});

const rubric = [
  { id: "r1", label: "Argument & thesis", max: 25, descriptors: ["Unclear/missing", "Stated but weak", "Clear & supported", "Sophisticated"] },
  { id: "r2", label: "Evidence & sources", max: 25, descriptors: ["No sources", "Limited", "Appropriate", "Rich & cited"] },
  { id: "r3", label: "Structure & flow", max: 20, descriptors: ["Disorganized", "Some structure", "Logical", "Polished"] },
  { id: "r4", label: "Mechanics & style", max: 15, descriptors: ["Many errors", "Some errors", "Mostly clean", "Polished"] },
  { id: "r5", label: "Originality", max: 15, descriptors: ["Derivative", "Some insight", "Insightful", "Highly original"] },
];

const submissions = [
  { id: "s1", name: "Mia Chen", title: "Working memory in classrooms", words: 1240, status: "Pending" },
  { id: "s2", name: "Ben Ortiz", title: "Phonological loop — case study", words: 980, status: "Pending" },
  { id: "s3", name: "Noor Said", title: "Chunking strategies", words: 1410, status: "Graded" },
];

function GradingPage() {
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ r1: 18, r2: 16, r3: 14, r4: 12, r5: 10 });
  const [feedback, setFeedback] = useState("Strong thesis and well-organized. Push your sources beyond the textbook in §3.");
  const [comments, setComments] = useState<{ id: string; line: number; text: string }[]>([
    { id: "c1", line: 12, text: "Nice framing — but cite Baddeley & Hitch (1974) here." },
  ]);
  const [newComment, setNewComment] = useState("");
  const current = submissions[idx];

  const total = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const max = rubric.reduce((a, r) => a + r.max, 0);
  const grade = Math.round((total / max) * 100);

  return (
    <DashboardShell>
      <TopBar title="Assignment Grading" subtitle="Essay 4 — Working Memory in Practice" showStreak={false} />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow disabled:opacity-40" disabled={idx === 0}>
            <ChevronLeft className="size-4" />
          </button>
          <div className="px-4 py-2 rounded-xl bg-card border-2 border-border chunky-shadow">
            <p className="text-xs font-bold text-foreground/60">{idx + 1} of {submissions.length}</p>
            <p className="font-black">{current.name}</p>
          </div>
          <button onClick={() => setIdx((i) => Math.min(submissions.length - 1, i + 1))} className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border chunky-shadow disabled:opacity-40" disabled={idx === submissions.length - 1}>
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border-2 border-border font-bold text-sm chunky-shadow">
            <Save className="size-4" /> Save draft
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow">
            <Send className="size-4" /> Release grade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
        {/* Submission viewer */}
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
          <div className="p-4 border-b-2 border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-primary" />
              <span className="font-black">{current.title}</span>
              <span className="text-foreground/50 font-bold">· {current.words} words</span>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border-2 border-border font-bold text-xs">
              <Paperclip className="size-3" /> Download
            </button>
          </div>
          <article className="p-6 prose-sm max-h-[60vh] overflow-y-auto text-sm leading-relaxed font-medium space-y-3 text-foreground/85">
            {[
              "Working memory is the cognitive system responsible for temporarily holding information available for processing. Unlike short-term memory, it actively manipulates that information in service of higher-order tasks such as reasoning and comprehension.",
              "Baddeley and Hitch (1974) proposed a multi-component model that has since been refined. The phonological loop maintains verbal information through articulatory rehearsal; the visuospatial sketchpad holds visual and spatial codes; and the central executive coordinates and allocates attention.",
              "In classroom contexts, working-memory limits help explain why complex instructions fail when broken into too few discrete steps. Chunking — combining related items into meaningful units — reliably increases capacity. Teachers can apply this by sequencing tasks, using dual-coded materials, and providing retrieval scaffolds.",
              "A short case from a Year-9 maths lesson illustrates this: students given step-by-step working completed 34% more problems than the control group given a single dense prompt. While modest, this aligns with cognitive-load theory and underscores the practical leverage of working-memory aware design.",
              "In sum, the working-memory framework offers both an explanation of common classroom failures and a clear set of design moves. Future work should explore long-term retention effects of these supports beyond the lesson itself.",
            ].map((p, i) => (
              <p key={i} className={comments.some((c) => c.line === (i + 1) * 12) ? "bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 rounded" : ""}>
                {p}
              </p>
            ))}
          </article>
        </section>

        {/* Rubric + comments */}
        <aside className="space-y-4">
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black">Rubric</h3>
              <div className="text-right">
                <p className="text-2xl font-black font-mono">{total}<span className="text-foreground/40 text-base">/{max}</span></p>
                <p className="text-xs font-bold text-primary">{grade}%</p>
              </div>
            </div>
            <ul className="space-y-4">
              {rubric.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm">{r.label}</span>
                    <span className="font-mono font-black text-xs">{scores[r.id]}/{r.max}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={r.max}
                    value={scores[r.id]}
                    onChange={(e) => setScores((s) => ({ ...s, [r.id]: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">
                    {r.descriptors[Math.min(3, Math.floor((scores[r.id] / r.max) * 4))]}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black mb-2">Overall feedback</h3>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4}
              className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none" />
          </div>

          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black flex items-center gap-2 mb-3">
              <MessageSquare className="size-4 text-primary" strokeWidth={2.5} /> Inline comments
            </h3>
            <ul className="space-y-2 mb-3">
              {comments.map((c) => (
                <li key={c.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400 mb-1">¶ {c.line}</p>
                  <p className="text-sm font-medium">{c.text}</p>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment…"
                className="flex-1 px-3 py-2 bg-background border-2 border-border rounded-lg text-sm font-medium outline-none focus:border-primary" />
              <button onClick={() => {
                if (!newComment.trim()) return;
                setComments((c) => [...c, { id: crypto.randomUUID(), line: comments.length * 24 + 24, text: newComment }]);
                setNewComment("");
              }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm">Add</button>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
