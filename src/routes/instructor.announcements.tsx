import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Megaphone, Pin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/instructor/announcements")({
  head: () => ({ meta: [{ title: "QuestLMS — Announcements" }] }),
  component: AnnouncementsPage,
});

type Post = { id: string; cls: string; title: string; body: string; pinned: boolean; at: string; reads: number; total: number };

const seed: Post[] = [
  { id: "p1", cls: "Cognitive Psychology", title: "Midterm rescheduled to Jun 18", body: "Hi everyone — the midterm has moved one week later. Use the extra time wisely!", pinned: true, at: "2h ago", reads: 96, total: 124 },
  { id: "p2", cls: "Organic Chemistry II", title: "Bring lab kits Thursday", body: "We're running the aldehyde synthesis lab. Bring goggles + your kit.", pinned: false, at: "Yesterday", reads: 72, total: 86 },
  { id: "p3", cls: "All classes", title: "Holiday — no class Friday", body: "Enjoy the long weekend!", pinned: false, at: "3d ago", reads: 320, total: 352 },
];

function AnnouncementsPage() {
  const [posts, setPosts] = useState(seed);
  const [cls, setCls] = useState("Cognitive Psychology");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosts((p) => [{ id: crypto.randomUUID(), cls, title, body, pinned: false, at: "now", reads: 0, total: 124 }, ...p]);
    setTitle(""); setBody("");
    toast.success("Announcement published", { description: `Sent to ${cls}.` });
  };

  return (
    <DashboardShell>
      <TopBar title="Announcements" subtitle="Broadcast updates to your classes" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <div className="space-y-3">
          {posts.map((p) => (
            <article key={p.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {p.pinned && <Pin className="size-4 text-primary" strokeWidth={2.5} />}
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{p.cls} · {p.at}</span>
                </div>
                <span className="text-[11px] font-bold font-mono text-foreground/60">{p.reads}/{p.total} read</span>
              </div>
              <h3 className="font-black text-lg">{p.title}</h3>
              <p className="text-sm font-medium text-foreground/70 leading-relaxed mt-1">{p.body}</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-3"><div className="h-full bg-primary" style={{ width: `${(p.reads / p.total) * 100}%` }} /></div>
            </article>
          ))}
        </div>

        <aside className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow h-fit lg:sticky lg:top-4">
          <h3 className="font-black text-lg flex items-center gap-2 mb-4"><Megaphone className="size-5 text-primary" strokeWidth={2.5} /> New announcement</h3>
          <form onSubmit={publish} className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Class</label>
              <select value={cls} onChange={(e) => setCls(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-bold outline-none">
                {["Cognitive Psychology", "Organic Chemistry II", "Calculus", "All classes"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quick title…" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-bold outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Write your message…" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-2 border-border text-sm font-medium outline-none resize-none" />
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform">
              <Send className="size-4" strokeWidth={2.5} /> Publish
            </button>
          </form>
        </aside>
      </div>
    </DashboardShell>
  );
}
