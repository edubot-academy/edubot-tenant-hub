import i18n from "@/lib/i18n";
import en from "@/locales/en/assistant.json";
import enPages from "@/locales/en/assistant-pages.json";
import ky from "@/locales/ky/assistant.json";
import kyPages from "@/locales/ky/assistant-pages.json";
import ru from "@/locales/ru/assistant.json";
import ruPages from "@/locales/ru/assistant-pages.json";

const resources = {
  en: [en, enPages],
  ky: [ky, kyPages],
  ru: [ru, ruPages],
} as const;

for (const [language, bundles] of Object.entries(resources)) {
  if (!i18n.hasResourceBundle(language, "common")) continue;
  for (const resource of bundles) {
    i18n.addResourceBundle(language, "common", resource, true, true);
  }
}
