import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Search, UserX, UserCheck } from "lucide-react";
import type { StaffRole } from "./StaffInviteForm";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  joined: string;
}

interface StaffMembersProps {
  members: StaffMember[];
  onRoleChange: (id: string, role: StaffRole) => void;
  onToggleActive: (id: string) => void;
}

const ROLES: StaffRole[] = ["instructor", "assistant", "company_admin"];

const roleStyles: Record<StaffRole, string> = {
  instructor: "bg-brand-primary-soft text-brand-primary-text",
  assistant: "bg-brand-secondary-soft text-brand-secondary-text",
  company_admin: "bg-brand-accent-soft text-accent",
  parent: "bg-orange-100 text-orange-800",
};

export function StaffMembers({ members, onRoleChange, onToggleActive }: StaffMembersProps) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const rows = members.filter(
    (m) => q === "" || m.name.toLowerCase().includes(q.toLowerCase()) || m.email.includes(q.toLowerCase()),
  );

  return (
    <section className="col-span-12 lg:col-span-7 bg-card border border-border rounded-2xl">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-foreground/60" strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider">{t("staff.members.title")}</h3>
          <span className="text-xs font-mono text-foreground/50">({rows.length})</span>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("staff.members.search")}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-foreground/55 border-b border-border">
              <th className="text-left p-3">{t("admin.users.col.name")}</th>
              <th className="text-left p-3 hidden md:table-cell">{t("admin.users.col.email")}</th>
              <th className="text-left p-3">{t("admin.users.col.role")}</th>
              <th className="text-left p-3">{t("admin.users.col.status")}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="p-3 font-semibold">{m.name}</td>
                <td className="p-3 text-foreground/60 font-mono text-xs hidden md:table-cell">{m.email}</td>
                <td className="p-3">
                  <select
                    value={m.role}
                    onChange={(e) => onRoleChange(m.id, e.target.value as StaffRole)}
                    disabled={!m.active}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-transparent cursor-pointer disabled:opacity-50 ${roleStyles[m.role]}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      m.active ? "bg-brand-primary-soft text-brand-primary-text" : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {m.active ? t("staff.members.active") : t("staff.members.deactivated")}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => onToggleActive(m.id)}
                    title={m.active ? t("staff.members.deactivate") : t("staff.members.reactivate")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
                  >
                    {m.active ? (
                      <>
                        <UserX className="size-3" strokeWidth={3} />
                        {t("staff.members.deactivate")}
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-3" strokeWidth={3} />
                        {t("staff.members.reactivate")}
                      </>
                    )}
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
