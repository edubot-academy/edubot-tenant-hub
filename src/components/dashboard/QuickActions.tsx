import { Sparkles, Megaphone, Trophy, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function QuickActions() {
  return (
    <div
      className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4 animate-bounce-in"
      style={{ animationDelay: "200ms" }}
    >
      <Link
        to="/course-studio"
        className="chunky-press p-6 bg-card border-2 border-border rounded-[24px] flex flex-col items-center justify-center gap-3 hover:border-primary/40 transition-colors cursor-pointer chunky-shadow"
      >
        <div className="size-12 bg-primary/15 text-primary rounded-full grid place-items-center">
          <Sparkles className="size-6" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-center leading-tight text-sm">Create<br />Lesson</span>
      </Link>

      <Link
        to="/instructor/announcements"
        className="chunky-press p-6 bg-card border-2 border-border rounded-[24px] flex flex-col items-center justify-center gap-3 hover:border-accent/50 transition-colors cursor-pointer chunky-shadow"
      >
        <div className="size-12 bg-accent/20 text-accent-foreground rounded-full grid place-items-center">
          <Megaphone className="size-6" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-center leading-tight text-sm">Post<br />Update</span>
      </Link>

      <Link
        to="/instructor/assignments"
        className="chunky-press col-span-2 p-5 bg-card border-2 border-border rounded-[24px] flex items-center justify-between hover:border-secondary/40 transition-colors cursor-pointer chunky-shadow"
      >
        <div className="flex items-center gap-4">
          <div className="size-12 bg-secondary/10 text-secondary rounded-full grid place-items-center">
            <Trophy className="size-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-left leading-tight">Set Weekly Challenge</span>
        </div>
        <ArrowRight className="size-5 text-foreground/30" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
