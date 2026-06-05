import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserPlus, Mail, ChevronDown } from "lucide-react";

const ROLES = ["instructor", "assistant", "company_admin"] as const;
type StaffRole = (typeof ROLES)[number];

interface StaffInviteFormProps {
  onInvite: (email: string, role: StaffRole) => void;
}

export function StaffInviteForm({ onInvite }: StaffInviteFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("instructor");
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!email.trim()) return;
    onInvite(email.trim(), role);
    setEmail("");
  };

  return (
    <section className="col-span-12 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="size-4 text-foreground/60" strokeWidth={2.5} />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("staff.invite.title")}</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("staff.invite.emailPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold bg-background border border-border rounded-md hover:bg-muted min-w-[160px] cursor-pointer"
          >
            <span>{t(`roles.${role}`)}</span>
            <ChevronDown className="size-3.5" strokeWidth={3} />
          </button>
          {open && (
            <div className="absolute top-full right-0 mt-1 w-full bg-popover border border-border rounded-md shadow-lg z-10 overflow-hidden">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm font-semibold hover:bg-muted cursor-pointer ${
                    r === role ? "bg-muted/60" : ""
                  }`}
                >
                  {t(`roles.${r}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={submit}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 cursor-pointer"
        >
          <UserPlus className="size-4" strokeWidth={3} />
          {t("staff.invite.send")}
        </button>
      </div>
    </section>
  );
}

export type { StaffRole };
