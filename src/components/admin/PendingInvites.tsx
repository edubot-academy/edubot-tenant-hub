import { useTranslation } from "react-i18next";
import { Clock, RefreshCw, X } from "lucide-react";
import type { StaffRole } from "./StaffInviteForm";

export interface Invite {
  id: string;
  email: string;
  role: StaffRole;
  sentAt: string;
}

interface PendingInvitesProps {
  invites: Invite[];
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
}

export function PendingInvites({ invites, onResend, onRevoke }: PendingInvitesProps) {
  const { t } = useTranslation();

  return (
    <section className="col-span-12 lg:col-span-5 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Clock className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("staff.pending.title")}</h3>
        <span className="ml-auto text-xs font-mono text-foreground/50">{invites.length}</span>
      </div>

      {invites.length === 0 ? (
        <div className="p-8 text-center text-sm text-foreground/50 font-medium">
          {t("staff.pending.empty")}
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {invites.map((inv) => (
            <li key={inv.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{inv.email}</div>
                <div className="text-[11px] text-foreground/55 font-medium">
                  {t(`roles.${inv.role}`)} · {inv.sentAt}
                </div>
              </div>
              <button
                onClick={() => onResend(inv.id)}
                title={t("staff.pending.resend")}
                className="p-1.5 rounded-md hover:bg-muted text-foreground/60 hover:text-foreground cursor-pointer"
              >
                <RefreshCw className="size-3.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => onRevoke(inv.id)}
                title={t("staff.pending.revoke")}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-foreground/60 hover:text-destructive cursor-pointer"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
