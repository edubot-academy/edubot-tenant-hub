import { Medal } from "lucide-react";
import { toast } from "sonner";

export function MilestoneCard() {
  return (
    <div
      className="p-6 bg-secondary text-secondary-foreground rounded-[32px] chunky-shadow relative overflow-hidden group animate-bounce-in"
      style={{ animationDelay: "600ms" }}
    >
      <div className="relative z-10 max-w-[75%]">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
          New Milestone
        </p>
        <h4 className="text-xl font-black mb-3">The Marathoner</h4>
        <p className="text-xs text-secondary-foreground/70 font-medium mb-4 leading-relaxed">
          Awarded to 12 students who completed 7-day streaks today.
        </p>
        <button
          type="button"
          onClick={() => toast.success("Reward sent to 12 students 🎉")}
          className="px-4 py-2 bg-secondary-foreground/10 hover:bg-secondary-foreground/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Send Reward
        </button>
      </div>
      <Medal
        className="absolute -right-4 -bottom-4 size-32 text-accent opacity-30 rotate-12 group-hover:rotate-0 transition-transform duration-500"
        strokeWidth={1.5}
      />
    </div>
  );
}
