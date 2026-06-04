import { Home, BookOpen, Library, Store, Target } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: BookOpen, label: "My Classes" },
  { icon: Library, label: "Quiz Bank" },
  { icon: Store, label: "Marketplace" },
];

export function Sidebar() {
  return (
    <nav className="w-64 shrink-0 border-r border-border bg-card p-6 flex flex-col gap-8 sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-2">
        <div className="size-10 bg-secondary text-secondary-foreground rounded-xl grid place-items-center font-black text-xl italic chunky-shadow">
          Q
        </div>
        <span className="font-extrabold text-2xl tracking-tighter uppercase">QuestLMS</span>
      </div>

      <div className="flex flex-col gap-2">
        {navItems.map(({ icon: Icon, label, active }) => (
          <a
            key={label}
            href="#"
            className={
              active
                ? "flex items-center gap-4 p-3 bg-primary/10 text-primary rounded-2xl font-bold transition-all"
                : "flex items-center gap-4 p-3 text-foreground/40 hover:bg-foreground/5 rounded-2xl font-bold transition-all"
            }
          >
            <Icon className="size-5" strokeWidth={2.5} />
            {label}
          </a>
        ))}
      </div>

      <div className="mt-auto p-4 bg-accent/15 rounded-3xl border-2 border-accent/30 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-accent-foreground/60" strokeWidth={2.5} />
          <span className="text-xs font-black uppercase tracking-widest text-accent-foreground/60">
            Teacher Goal
          </span>
        </div>
        <div className="h-3 w-full bg-card rounded-full overflow-hidden border border-accent/30">
          <div className="h-full bg-accent w-[65%]" />
        </div>
        <span className="text-sm font-bold">12 / 20 Lessons Mastery</span>
      </div>
    </nav>
  );
}
