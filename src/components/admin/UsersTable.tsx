import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, MoreHorizontal } from "lucide-react";

const users = [
  { id: 1, name: "Aris Bekov", email: "aris@edubot.local", role: "instructor", status: "active", joined: "2024-01-12" },
  { id: 2, name: "Saltanat T.", email: "salta@edubot.local", role: "instructor", status: "active", joined: "2024-02-03" },
  { id: 3, name: "Marat K.", email: "marat@edubot.local", role: "assistant", status: "active", joined: "2024-03-19" },
  { id: 4, name: "Aizat M.", email: "aizat@edubot.local", role: "student", status: "active", joined: "2024-04-02" },
  { id: 5, name: "Bekzat T.", email: "bekzat@edubot.local", role: "student", status: "pending", joined: "2024-05-11" },
  { id: 6, name: "Dilnoza K.", email: "dilnoza@edubot.local", role: "student", status: "active", joined: "2024-05-14" },
  { id: 7, name: "Erlan S.", email: "erlan@edubot.local", role: "student", status: "suspended", joined: "2024-05-22" },
];

const roleStyles: Record<string, string> = {
  instructor: "bg-brand-primary-soft text-brand-primary-text",
  assistant: "bg-brand-secondary-soft text-brand-secondary-text",
  student: "bg-muted text-foreground/70",
};
const statusStyles: Record<string, string> = {
  active: "bg-brand-primary-soft text-brand-primary-text",
  pending: "bg-brand-accent-soft text-accent",
  suspended: "bg-destructive/15 text-destructive",
};

const filters = ["all", "instructor", "assistant", "student"] as const;

function formatJoinedDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function UsersTable() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const locale = i18n.resolvedLanguage || i18n.language;

  const rows = users.filter(
    (u) =>
      (filter === "all" || u.role === filter) &&
      (q === "" || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q.toLowerCase()))
  );
  const joinedDates = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, formatJoinedDate(user.joined, locale)])),
    [locale],
  );

  return (
    <section className="col-span-12 bg-card border border-border rounded-2xl">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-foreground/60" strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider">{t("admin.users.title")}</h3>
          <span className="text-xs font-mono text-foreground/50">({rows.length})</span>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.users.search")}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                filter === f ? "bg-foreground text-background" : "text-foreground/60 hover:bg-muted"
              }`}
            >
              {t(`admin.users.filter.${f}`)}
            </button>
          ))}
        </div>

        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold cursor-pointer hover:opacity-90">
          <Plus className="size-3.5" strokeWidth={3} />
          {t("admin.users.invite")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-foreground/55 border-b border-border">
              <th className="text-left p-3">{t("admin.users.col.name")}</th>
              <th className="text-left p-3 hidden md:table-cell">{t("admin.users.col.email")}</th>
              <th className="text-left p-3">{t("admin.users.col.role")}</th>
              <th className="text-left p-3">{t("admin.users.col.status")}</th>
              <th className="text-left p-3 hidden lg:table-cell">{t("admin.users.col.joined")}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="p-3 font-semibold">{u.name}</td>
                <td className="p-3 text-foreground/60 font-mono text-xs hidden md:table-cell">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleStyles[u.role]}`}>
                    {t(`roles.${u.role}`)}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyles[u.status]}`}>
                    {t(`admin.users.status.${u.status}`)}
                  </span>
                </td>
                <td className="p-3 text-foreground/55 font-mono text-xs hidden lg:table-cell">{joinedDates[u.id]}</td>
                <td className="p-3 text-right">
                  <button className="text-foreground/40 hover:text-foreground p-1 cursor-pointer">
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
