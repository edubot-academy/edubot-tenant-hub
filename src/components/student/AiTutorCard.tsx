import { useTranslation } from "react-i18next";
import { Bot, Send, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function AiTutorCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const go = () => navigate({ to: "/ai-tutor" });
  const suggestions = [
    t("student.ai.s1"),
    t("student.ai.s2"),
    t("student.ai.s3"),
  ];
  return (
    <div className="bg-card border-2 border-border rounded-[28px] p-5 chunky-shadow animate-bounce-in" style={{ animationDelay: "700ms" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="size-11 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center chunky-shadow">
          <Bot className="size-5" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-base flex items-center gap-1.5">
            {t("student.ai.title")}
            <Sparkles className="size-3.5 text-accent fill-accent" />
          </h3>
          <p className="text-xs font-medium text-foreground/50">{t("student.ai.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={go}
            className="w-full text-left text-xs font-bold px-3 py-2 rounded-xl bg-muted hover:bg-foreground/5 transition-colors flex items-center gap-2"
          >
            <span className="size-1.5 rounded-full bg-primary shrink-0" />
            <span className="truncate">{s}</span>
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); go(); }}
      >
        <input
          placeholder={t("student.ai.placeholder")}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium placeholder:text-foreground/40 focus:outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          className="size-10 grid place-items-center rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-transform"
          aria-label={t("student.ai.send")}
        >
          <Send className="size-4" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
