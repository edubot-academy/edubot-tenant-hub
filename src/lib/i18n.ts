import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import kyCommon from "@/locales/ky/common.json";
import ruCommon from "@/locales/ru/common.json";
import enCommon from "@/locales/en/common.json";

export const SUPPORTED_LANGUAGES = ["ky", "ru", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        ky: { common: kyCommon },
        ru: { common: ruCommon },
        en: { common: enCommon },
      },
      fallbackLng: "ky",
      supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
      defaultNS: "common",
      ns: ["common"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "questlms.lang",
        caches: ["localStorage"],
      },
      react: { useSuspense: false },
    });
}

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language || "ky";
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
