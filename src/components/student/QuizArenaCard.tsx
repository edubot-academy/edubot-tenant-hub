import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function QuizArenaCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");

  return (
    <div
      className="bg-accent text-accent-foreground rounded-[28px] p-5 chunky-shadow animate-bounce-in relative overflow-hidden"
      style={{ animationDelay: "500ms" }}
    >
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <Zap className="size-5 fill-accent-foreground" strokeWidth={2.5} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {t("student.quizArena.tag")}
        </span>
      </div>
      <h3 className="text-xl font-black mb-2 relative z-10">{t("student.quizArena.title")}</h3>
      <p className="text-sm font-medium opacity-70 mb-4 relative z-10">
        {t("student.quizArena.subtitle")}
      </p>
      <form
        className="flex gap-2 relative z-10"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/live-quiz-join" });
        }}
      >
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder={t("student.quizArena.pinPlaceholder")}
          className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-accent-foreground/10 border-2 border-accent-foreground/20 font-mono font-black tracking-widest text-lg placeholder:opacity-40 focus:outline-none focus:border-accent-foreground/60"
        />
        <button
          type="submit"
          disabled={pin.length < 4}
          className="px-4 py-3 bg-accent-foreground text-accent rounded-2xl font-black grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          aria-label={t("student.quizArena.join")}
        >
          <ArrowRight className="size-5" strokeWidth={3} />
        </button>
      </form>
    </div>
  );
}
