import { useTranslation } from "react-i18next";
import { Moon, Sun, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, resolved, setTheme } = useTheme();
  const Icon = resolved === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid size-9 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
        aria-label="Theme"
      >
        <Icon className="size-4" strokeWidth={2.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem onSelect={() => setTheme("light")} className={theme === "light" ? "font-bold text-primary" : ""}>
          <Sun className="size-4 mr-2" /> {t("theme.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")} className={theme === "dark" ? "font-bold text-primary" : ""}>
          <Moon className="size-4 mr-2" /> {t("theme.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")} className={theme === "system" ? "font-bold text-primary" : ""}>
          <Monitor className="size-4 mr-2" /> {t("theme.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
