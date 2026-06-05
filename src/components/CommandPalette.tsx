import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
  label: string;
  to: string;
  group: string;
  keywords?: string[];
}

const ROLE_LABELS: Record<Role, string> = {
  instructor: "Instructor",
  student: "Student",
  parent: "Parent",
  assistant: "Assistant",
  company_admin: "Admin",
  owner: "Owner",
};

function buildEntries(): Entry[] {
  const entries: Entry[] = [];
  (Object.keys(ROLE_CONFIG) as Role[]).forEach((role) => {
    const cfg = ROLE_CONFIG[role];
    cfg.nav.forEach((item) => {
      entries.push({
        label: item.key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        to: item.to,
        group: ROLE_LABELS[role],
        keywords: [item.key, role],
      });
    });
  });
  // Dedupe
  const seen = new Map<string, Entry>();
  for (const e of entries) {
    const key = `${e.group}:${e.to}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  return [...seen.values()];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setRole } = useRole();
  const { theme, setTheme } = useTheme();
  const entries = buildEntries();

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
    // Navigate using string path; routes are file-based and validated at build
    navigate({ to: to as never });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, roles, actions…  (try 'leagues' or 'tutor')" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {Object.entries(groupBy(entries, (e) => e.group)).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => (
              <CommandItem
                key={`${group}:${item.to}`}
                value={`${group} ${item.label} ${item.to}`}
                onSelect={() => {
                  // Switch role context when jumping to a role-specific surface
                  const role = (Object.keys(ROLE_LABELS) as Role[]).find(
                    (r) => ROLE_LABELS[r] === group,
                  );
                  if (role) setRole(role);
                  go(item.to);
                }}
              >
                <Search className="size-4 mr-2 opacity-60" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground font-mono">{item.to}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />
        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); }}>
            <Keyboard className="size-4 mr-2 opacity-60" />
            Toggle theme · currently {theme}
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
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}
