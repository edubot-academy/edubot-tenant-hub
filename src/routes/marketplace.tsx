import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Store, Star, Download } from "lucide-react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "QuestLMS — Marketplace" }] }),
  component: MarketplacePage,
});

const items = [
  { id: "1", title: "100 ready-made science quizzes", author: "ScienceLab Co.", price: "Free", rating: 4.8, downloads: "12k", emoji: "🧪" },
  { id: "2", title: "AP Psychology starter pack", author: "Prof. Helen R.", price: "$19", rating: 4.9, downloads: "3.2k", emoji: "🧠" },
  { id: "3", title: "Math problem set generator", author: "MathBots", price: "$9/mo", rating: 4.6, downloads: "8.4k", emoji: "➗" },
  { id: "4", title: "Spaced repetition flashcards", author: "Recall Inc.", price: "Free", rating: 4.7, downloads: "21k", emoji: "🃏" },
  { id: "5", title: "History timeline templates", author: "ChronoEd", price: "$12", rating: 4.5, downloads: "1.8k", emoji: "🏛️" },
  { id: "6", title: "Lab safety video series", author: "SafeLab", price: "$29", rating: 4.9, downloads: "5.1k", emoji: "🛡️" },
];

function MarketplacePage() {
  return (
    <DashboardShell>
      <TopBar title="Marketplace" subtitle="Shared content from instructors and partners around the world." showStreak={false} />

      <div className="mb-6 flex items-center gap-2 text-sm text-foreground/60 font-medium">
        <Store className="size-4 text-primary" /> {items.length} items featured this week
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((it) => (
          <article key={it.id} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-4xl">{it.emoji}</span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-accent text-accent-foreground">
                {it.price}
              </span>
            </div>
            <h3 className="font-black text-base leading-tight">{it.title}</h3>
            <p className="text-xs text-foreground/50 font-medium">by {it.author}</p>
            <div className="flex items-center gap-4 text-xs font-bold text-foreground/60 mt-auto">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 text-yellow-500 fill-yellow-500" /> {it.rating}
              </span>
              <span className="inline-flex items-center gap-1">
                <Download className="size-3.5" /> {it.downloads}
              </span>
            </div>
            <button className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
              Add to library
            </button>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
