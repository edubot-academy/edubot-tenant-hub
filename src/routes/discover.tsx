import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Search, Star, Users, Clock, Sparkles, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "QuestLMS — Discover Courses" }] }),
  component: DiscoverPage,
});

const categories = ["All", "Science", "Math", "Languages", "Arts", "Tech", "Wellness"];

const courses = [
  { id: "1", title: "Cognitive Psychology", instructor: "Prof. Aris", rating: 4.9, students: 1240, hours: 28, level: "Intermediate", cat: "Science", tag: "Trending" },
  { id: "2", title: "Calculus Foundations", instructor: "Dr. Nuray", rating: 4.7, students: 892, hours: 36, level: "Beginner", cat: "Math", tag: "New" },
  { id: "3", title: "Modern World History", instructor: "Mr. Beksultan", rating: 4.8, students: 2104, hours: 22, level: "All levels", cat: "Arts" },
  { id: "4", title: "Spanish for Beginners", instructor: "Sra. Lucia", rating: 4.9, students: 3201, hours: 40, level: "Beginner", cat: "Languages", tag: "Bestseller" },
  { id: "5", title: "Intro to Python", instructor: "Eng. Daniyar", rating: 4.8, students: 5421, hours: 32, level: "Beginner", cat: "Tech", tag: "Trending" },
  { id: "6", title: "Mindful Studying", instructor: "Coach Aida", rating: 4.6, students: 540, hours: 8, level: "All levels", cat: "Wellness" },
];

function DiscoverPage() {
  const [active, setActive] = useState("All");
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const filtered = courses.filter(
    (c) => (active === "All" || c.cat === active) && c.title.toLowerCase().includes(q.toLowerCase()),
  );
  const enroll = (title: string) => {
    toast.success(`Enrolled in ${title}`, { description: "Added to My Courses." });
    setTimeout(() => navigate({ to: "/course-player" }), 350);
  };

  return (
    <DashboardShell>
      <TopBar title="Discover" subtitle="Find your next adventure" />

      <section className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border-2 border-border rounded-3xl p-6 chunky-shadow mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-5 text-primary" strokeWidth={2.5} />
          <span className="text-xs font-black uppercase tracking-wider">Recommended for you</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black leading-tight">Build a learning habit you'll love.</h2>
        <p className="text-sm font-medium text-foreground/70 mt-1">Hand-picked courses based on your skills and goals.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-card border-2 border-border rounded-2xl px-4 chunky-shadow">
          <Search className="size-4 text-foreground/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, topics, instructors…"
            className="bg-transparent outline-none flex-1 py-3 text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
              active === c
                ? "bg-primary text-primary-foreground border-foreground chunky-shadow"
                : "bg-card border-border hover:-translate-y-0.5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <article key={c.id} className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow hover-lift">
            <div className="h-32 bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 relative">
              <BookOpen className="absolute inset-0 m-auto size-12 text-foreground/30" strokeWidth={2} />
              {c.tag && (
                <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-foreground text-background text-[10px] font-black uppercase">
                  {c.tag}
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{c.cat} · {c.level}</p>
              <h3 className="font-black text-base leading-tight mt-1">{c.title}</h3>
              <p className="text-xs font-medium text-foreground/60 mt-0.5">{c.instructor}</p>
              <div className="flex items-center gap-3 mt-3 text-xs font-bold text-foreground/70">
                <span className="flex items-center gap-1"><Star className="size-3.5 fill-current text-amber-500" strokeWidth={2.5} />{c.rating}</span>
                <span className="flex items-center gap-1"><Users className="size-3.5" />{c.students.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Clock className="size-3.5" />{c.hours}h</span>
              </div>
              <button onClick={() => enroll(c.title)} className="mt-4 w-full py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform">
                Enroll
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm font-bold text-foreground/50 py-12">No courses match your search.</p>
        )}
      </div>
    </DashboardShell>
  );
}
