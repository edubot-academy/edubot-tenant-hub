import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ROLE_CONFIG, useRole, type Role } from "@/lib/roles";
import { Search, Keyboard } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

interface Entry {
  labelKey: string;
  fallbackLabel: string;
  to: string;
  groupKey: string;
  role: Role;
  keywords?: string[];
}

function buildEntries(): Entry[] {
  const entries: Entry[] = [];
  (Object.keys(ROLE_CONFIG) as Role[]).forEach((role) => {
    const cfg = ROLE_CONFIG[role];
    cfg.nav.forEach((item) => {
      entries.push({
        labelKey: `nav.${item.key}`,
        fallbackLabel: item.key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        to: item.to,
        groupKey: `roles.${role}`,
        role,
        keywords: [item.key, role],
      });
    });
  });
  const seen = new Map<string, Entry>();
  for (const e of entries) {
    const key = `${e.role}:${e.to}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  return [...seen.values()];
}

export function CommandPalette() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setRole } = useRole();
  const { resolved, setTheme } = useTheme();
  const entries = useMemo(buildEntries, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to: to as never });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("command.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("command.empty")}</CommandEmpty>

        {Object.entries(groupBy(entries, (e) => e.role)).map(([role, items]) => (
          <CommandGroup key={role} heading={t(items[0]?.groupKey ?? "roles.student")}>
            {items.map((item) => {
              const label = t(item.labelKey, { defaultValue: item.fallbackLabel });
              return (
                <CommandItem
                  key={`${role}:${item.to}`}
                  value={`${t(item.groupKey)} ${label} ${item.to}`}
                  onSelect={() => {
                    setRole(item.role);
                    go(item.to);
                  }}
                >
                  <Search className="size-4 mr-2 opacity-60" />
                  <span>{label}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{item.to}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />
        <CommandGroup heading={t("command.appearance")}> 
          <CommandItem onSelect={() => {
            const next = resolved === "dark" ? "light" : "dark";
            setTheme(next);
            toast.success(t("command.themeSwitched", { theme: t(`theme.${next}`) }));
            setOpen(false);
          }}>
            <Keyboard className="size-4 mr-2 opacity-60" />
            {t("command.toggleTheme", { theme: t(`theme.${resolved}`) })}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement).isContentEditable;
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}
