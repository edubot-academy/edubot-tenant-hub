import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? "ky").slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold transition-colors hover:bg-muted"
        aria-label={t("language.label")}
      >
        <Globe className="size-4" strokeWidth={2.5} />
        <span className="uppercase">{current}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onSelect={() => i18n.changeLanguage(lng)}
            className={current === lng ? "font-bold text-primary" : ""}
          >
            {t(`language.${lng}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
