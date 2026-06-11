import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import kyCommon from "@/locales/ky/common.json";
import kyBranch from "@/locales/ky/branch.json";
import kyTeaching from "@/locales/ky/teaching.json";
import kyStudent from "@/locales/ky/student.json";
import ruCommon from "@/locales/ru/common.json";
import ruBranch from "@/locales/ru/branch.json";
import ruInstructor from "@/locales/ru/instructor.json";
import ruTeaching from "@/locales/ru/teaching.json";
import ruStudent from "@/locales/ru/student.json";
import enCommon from "@/locales/en/common.json";
import enBranch from "@/locales/en/branch.json";
import enTeaching from "@/locales/en/teaching.json";
import enStudent from "@/locales/en/student.json";
import { DEFAULT_LOCALE, resolveLocale, SUPPORTED_LOCALES } from "@/lib/locale";

type TranslationResource = Record<string, unknown>;

function isPlainObject(value: unknown): value is TranslationResource {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mergeTranslations(base: TranslationResource, override: TranslationResource): TranslationResource {
  const output: TranslationResource = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = output[key];
    output[key] = isPlainObject(current) && isPlainObject(value)
      ? mergeTranslations(current, value)
      : value;
  }

  return output;
}

const resources = {
  ky: { common: mergeTranslations(mergeTranslations(mergeTranslations(kyCommon, kyBranch), kyTeaching), kyStudent) },
  ru: { common: mergeTranslations(mergeTranslations(mergeTranslations(mergeTranslations(ruCommon, ruBranch), ruInstructor), ruTeaching), ruStudent) },
  en: { common: mergeTranslations(mergeTranslations(mergeTranslations(enCommon, enBranch), enTeaching), enStudent) },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
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
