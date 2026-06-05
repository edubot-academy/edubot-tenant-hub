import { AlertTriangle, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const students = [
  { id: 1, name: "Aizat M.", reasonKey: "instructor.atRisk.r1", initials: "AM" },
  { id: 2, name: "Bekzat T.", reasonKey: "instructor.atRisk.r2", initials: "BT" },
  { id: 3, name: "Dilnoza K.", reasonKey: "instructor.atRisk.r3", initials: "DK" },
];

export function AtRiskStudents() {
  const { t } = useTranslation();
  return (
    <section className="col-span-12 lg:col-span-8 p-6 bg-card border-2 border-border rounded-[28px] chunky-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
          <AlertTriangle className="size-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black">{t("instructor.atRisk.title")}</h3>
          <p className="text-xs text-foreground/55 font-medium">{t("instructor.atRisk.subtitle")}</p>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {students.map((s) => (
          <li
            key={s.id}
            className="p-4 bg-muted/40 rounded-2xl border border-border/60 flex flex-col items-start gap-3"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="size-10 rounded-full bg-secondary/15 text-secondary grid place-items-center font-black text-sm shrink-0">
                {s.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{s.name}</div>
                <div className="text-[11px] text-destructive font-bold uppercase tracking-wider">
                  {t(s.reasonKey)}
                </div>
              </div>
            </div>
            <button className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-card border-2 border-border font-bold text-xs hover:border-primary/40 cursor-pointer transition-colors">
              <MessageCircle className="size-3.5" strokeWidth={2.5} />
              {t("instructor.atRisk.reach")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
