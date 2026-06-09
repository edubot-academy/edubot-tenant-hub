import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import kyCommon from "@/locales/ky/common.json";
import ruCommon from "@/locales/ru/common.json";
import enCommon from "@/locales/en/common.json";
import { DEFAULT_LOCALE, resolveLocale, SUPPORTED_LOCALES } from "@/lib/locale";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      ky: { common: kyCommon },
      ru: { common: ruCommon },
      en: { common: enCommon },
    },
    lng: resolveLocale(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnEmptyString: false,
  });
}

export default i18n;
