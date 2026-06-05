import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import kyCommon from "@/locales/ky/common.json";
import ruCommon from "@/locales/ru/common.json";
import enCommon from "@/locales/en/common.json";

export const SUPPORTED_LANGUAGES = ["ky", "ru", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANG_STORAGE_KEY = "questlms.lang";

if (!i18n.isInitialized) {
  // Always init with the default language so SSR and the first client render
  // produce identical markup. The stored user preference is applied after mount
  // (see hydrateLanguageFromStorage), which avoids hydration mismatches.
  i18n.use(initReactI18next).init({
    resources: {
      ky: { common: kyCommon },
      ru: { common: ruCommon },
      en: { common: enCommon },
    },
    lng: "ky",
    fallbackLng: "ky",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function hydrateLanguageFromStorage() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  const lang =
    stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)
      ? stored
      : null;
  if (lang && lang !== i18n.language) {
    void i18n.changeLanguage(lang);
  }
  document.documentElement.lang = i18n.language || "ky";
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  });
}

export default i18n;
