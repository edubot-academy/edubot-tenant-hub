import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import {
  Sparkles, Bold, Italic, List, Heading1, Heading2, Link as LinkIcon,
  Image as ImageIcon, Video, FileText, Plus, GripVertical, Save, Eye, Wand2
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/course-studio")({
  head: () => ({ meta: [{ title: "QuestLMS — Course Studio" }] }),
  component: CourseStudioPage,
});

type Block = { id: string; type: "h1" | "h2" | "p" | "list" | "video" | "quiz"; content: string };

const initialBlocks: Block[] = [
  { id: "b1", type: "h1", content: "Module 3 — Working Memory" },
  { id: "b2", type: "p", content: "Working memory holds and manipulates information across short timescales. In this module we'll explore Baddeley's model, capacity limits, and rehearsal strategies." },
  { id: "b3", type: "h2", content: "Learning objectives" },
  { id: "b4", type: "list", content: "Define working memory\nContrast with short-term memory\nApply chunking to improve recall" },
  { id: "b5", type: "video", content: "Lecture: The Phonological Loop (12m)" },
];

const lessons = [
  { id: "l1", title: "Intro to Memory", state: "Published" },
  { id: "l2", title: "Sensory Memory", state: "Published" },
  { id: "l3", title: "Working Memory", state: "Editing" },
  { id: "l4", title: "Long-Term Memory", state: "Draft" },
];

function CourseStudioPage() {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setBlocks((b) => [
        ...b,
        { id: crypto.randomUUID(), type: "h2", content: `AI: ${prompt}` },
        { id: crypto.randomUUID(), type: "p", content: "Generated explanation appears here with clear examples and a closing summary tailored to your learners." },
        { id: crypto.randomUUID(), type: "list", content: "Key point one\nKey point two\nKey point three" },
      ]);
      setPrompt("");
      setGenerating(false);
    }, 900);
  };

  const addBlock = (type: Block["type"]) =>
    setBlocks((b) => [...b, { id: crypto.randomUUID(), type, content: "" }]);

  return (
    <DashboardShell>
      <TopBar title="Course Studio" subtitle="Author rich lessons with an AI co-writer." showStreak={false} />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-5">
        {/* Lessons sidebar */}
        <aside className="bg-card border-2 border-border rounded-3xl p-4 chunky-shadow h-fit">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground/60 mb-3">Lessons</h3>
          <ul className="space-y-1.5">
            {lessons.map((l, i) => (
              <li key={l.id}
                className={`p-3 rounded-xl border-2 ${i === 2 ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"} cursor-pointer transition-colors`}>
                <p className="font-bold text-sm truncate">{l.title}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mt-1">{l.state}</p>
              </li>
            ))}
          </ul>
          <button className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-border font-bold text-sm hover:bg-muted transition-colors">
            <Plus className="size-4" strokeWidth={3} /> New lesson
          </button>
        </aside>

        {/* Editor */}
        <section className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
          <div className="flex items-center gap-1 p-2 border-b-2 border-border bg-muted/40 flex-wrap">
            {[Bold, Italic, Heading1, Heading2, List, LinkIcon, ImageIcon, Video, FileText].map((Icon, i) => (
              <button key={i} className="size-9 grid place-items-center rounded-lg hover:bg-background transition-colors" aria-label="format">
                <Icon className="size-4" />
              </button>
            ))}
            <div className="flex-1" />
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-foreground/10 font-bold text-xs transition-colors">
              <Eye className="size-3.5" /> Preview
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              <Save className="size-3.5" /> Save
            </button>
          </div>
          <div className="p-6 space-y-3 max-h-[68vh] overflow-y-auto">
            {blocks.map((b) => (
              <div key={b.id} className="group flex gap-2 items-start">
                <button className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 text-foreground/40" aria-label="drag">
                  <GripVertical className="size-4" />
                </button>
                <BlockEditor block={b} onChange={(content) =>
                  setBlocks((bs) => bs.map((x) => x.id === b.id ? { ...x, content } : x))
                } />
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-3 border-t-2 border-dashed border-border">
              {(["h2", "p", "list", "video", "quiz"] as const).map((t) => (
                <button key={t} onClick={() => addBlock(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-border hover:bg-muted font-bold text-xs uppercase tracking-wider transition-colors">
                  <Plus className="size-3" strokeWidth={3} /> {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* AI panel */}
        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit space-y-4">
          <h3 className="font-black flex items-center gap-2">
            <Sparkles className="size-4 text-primary" strokeWidth={2.5} /> AI co-writer
          </h3>
          <p className="text-xs text-foreground/60 font-medium">Describe what to add. I'll draft a section you can keep, edit or discard.</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Explain chunking with two examples for Year-9 students"
            rows={5}
            className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-medium outline-none focus:border-primary resize-none"
          />
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm chunky-shadow disabled:opacity-50 transition-opacity"
          >
            <Wand2 className="size-4" strokeWidth={2.5} />
            {generating ? "Drafting…" : "Generate section"}
          </button>
          <div className="space-y-2 pt-2 border-t-2 border-border">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Quick actions</p>
            {["Summarize this lesson", "Suggest 5 quiz questions", "Add a worked example", "Rewrite simpler"].map((s) => (
              <button key={s} onClick={() => setPrompt(s)}
                className="w-full text-left p-2.5 rounded-lg bg-muted hover:bg-foreground/10 font-bold text-xs transition-colors">
                {s}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (s: string) => void }) {
  const base = "w-full bg-transparent outline-none font-medium resize-none";
  if (block.type === "h1")
    return <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Title…"
      className={`${base} text-3xl font-black`} />;
  if (block.type === "h2")
    return <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Heading…"
      className={`${base} text-xl font-black`} />;
  if (block.type === "list")
    return <textarea value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="One item per line…"
      rows={Math.max(3, block.content.split("\n").length)} className={`${base} text-sm leading-relaxed pl-5`} />;
  if (block.type === "video")
    return <div className="w-full p-4 bg-muted border-2 border-dashed border-border rounded-xl flex items-center gap-3">
      <Video className="size-5 text-primary" />
      <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Video URL or title…"
        className={`${base} text-sm`} />
    </div>;
  if (block.type === "quiz")
    return <div className="w-full p-4 bg-accent/10 border-2 border-dashed border-accent rounded-xl flex items-center gap-3">
      <FileText className="size-5 text-accent-foreground" />
      <input value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Quiz title to embed…"
        className={`${base} text-sm`} />
    </div>;
  return <textarea value={block.content} onChange={(e) => onChange(e.target.value)} placeholder="Write…"
    rows={Math.max(2, Math.ceil(block.content.length / 70))} className={`${base} text-base leading-relaxed`} />;
}
