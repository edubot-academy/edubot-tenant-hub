import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

const children = [
  { id: "1", name: "Aizat", grade: "Grade 9", initials: "AI" },
  { id: "2", name: "Bekzat", grade: "Grade 6", initials: "BE" },
];

export function ChildSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = children.find((c) => c.id === selectedId) ?? children[0];

  return (
    <div className="col-span-12 relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full sm:w-auto flex items-center gap-4 p-4 pr-5 bg-card border-2 border-border rounded-[24px] chunky-shadow hover:border-brand-primary-border transition-colors cursor-pointer"
      >
        <div className="size-12 rounded-full bg-brand-primary-emphasis text-primary grid place-items-center font-black text-base">
          {selected.initials}
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground/55">
            {t("parent.viewingChild")}
          </div>
          <div className="font-black text-lg leading-tight">
            {selected.name}{" "}
            <span className="text-sm font-semibold text-foreground/60">· {selected.grade}</span>
          </div>
        </div>
        <ChevronDown
          className={`size-5 text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full sm:w-72 bg-card border-2 border-border rounded-2xl chunky-shadow p-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-muted/60 transition-colors cursor-pointer ${
                c.id === selectedId ? "bg-muted/40" : ""
              }`}
            >
              <div className="size-9 rounded-full bg-brand-primary-emphasis text-primary grid place-items-center font-black text-xs">
                {c.initials}
              </div>
              <div>
                <div className="font-bold text-sm">{c.name}</div>
                <div className="text-xs text-foreground/55 font-medium">{c.grade}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
