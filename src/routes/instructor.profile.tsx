import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Star, Users, BookOpen, Award, Globe, Linkedin, Twitter, Edit3 } from "lucide-react";

export const Route = createFileRoute("/instructor/profile")({
  head: () => ({ meta: [{ title: "QuestLMS — Instructor Profile" }] }),
  component: InstructorProfile,
});

const courses = [
  { title: "Cognitive Psychology", students: 124, rating: 4.9 },
  { title: "Intro to Memory", students: 412, rating: 4.8 },
  { title: "Attention & Perception", students: 89, rating: 4.7 },
];

function InstructorProfile() {
  return (
    <DashboardShell>
      <TopBar title="Public Profile" subtitle="How students see you on QuestLMS" />

      <section className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow mb-5">
        <div className="h-32 bg-gradient-to-br from-primary/40 via-secondary/40 to-accent/40" />
        <div className="p-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="size-24 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center text-3xl font-black border-4 border-card chunky-shadow">PA</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black">Prof. Aris Bekov</h2>
              <p className="text-sm font-bold text-foreground/60">PhD · Cognitive Psychology · QuestLMS Top Instructor</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[["Students", "625"], ["Courses", "8"], ["Rating", "4.9 ★"], ["Years", "12"]].map(([k, v]) => (
                  <span key={k} className="px-3 py-1.5 rounded-xl bg-muted font-bold text-xs"><span className="text-foreground/50">{k} · </span>{v}</span>
                ))}
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow"><Edit3 className="size-4" strokeWidth={2.5} /> Edit profile</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-lg mb-3">About</h3>
            <p className="text-sm font-medium leading-relaxed text-foreground/80">
              I'm a cognitive psychologist studying how attention shapes learning. I've taught over 600 students across QuestLMS and love designing courses that feel like a great conversation. When I'm not teaching, I'm probably hiking with my dog or losing at chess.
            </p>
            <div className="flex gap-2 mt-4">
              <a className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10"><Globe className="size-4" /></a>
              <a className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10"><Linkedin className="size-4" /></a>
              <a className="size-9 grid place-items-center rounded-xl bg-muted hover:bg-foreground/10"><Twitter className="size-4" /></a>
            </div>
          </section>

          <section className="bg-card border-2 border-border rounded-3xl p-6 chunky-shadow">
            <h3 className="font-black text-lg flex items-center gap-2 mb-4"><BookOpen className="size-5 text-primary" strokeWidth={2.5} /> Courses taught</h3>
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.title} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border">
                  <span className="font-black text-sm">{c.title}</span>
                  <span className="flex items-center gap-3 text-xs font-bold text-foreground/60">
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{c.students}</span>
                    <span className="inline-flex items-center gap-1 text-amber-600"><Star className="size-3.5 fill-current" />{c.rating}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-lg flex items-center gap-2 mb-3"><Award className="size-5 text-secondary" strokeWidth={2.5} /> Credentials</h3>
            <ul className="space-y-2 text-sm">
              <li className="font-medium">PhD Cognitive Psychology — Stanford</li>
              <li className="font-medium">MSc Neuroscience — UCL</li>
              <li className="font-medium">Top Instructor 2024, 2025</li>
            </ul>
          </section>
          <section className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-lg mb-3">Recent reviews</h3>
            <ul className="space-y-3">
              {[
                { name: "Mia C.", body: "Best teacher I've had — explanations are crystal clear." },
                { name: "A. Murat", body: "His feedback genuinely helped me grow as a writer." },
                { name: "F. Saltanat", body: "Lectures fly by. 10/10." },
              ].map((r) => (
                <li key={r.name} className="text-xs">
                  <p className="font-medium text-foreground/80">"{r.body}"</p>
                  <p className="font-black uppercase tracking-wider text-foreground/50 mt-1 text-[10px]">— {r.name}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
