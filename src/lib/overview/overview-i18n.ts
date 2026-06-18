import i18n from "@/lib/i18n";
import en from "@/locales/en/overview.json";
import ky from "@/locales/ky/overview.json";
import ru from "@/locales/ru/overview.json";

const resources = { en, ky, ru } as const;

for (const [language, resource] of Object.entries(resources)) {
  if (!i18n.hasResourceBundle(language, "common")) continue;
  i18n.addResourceBundle(language, "common", resource, true, true);
}
