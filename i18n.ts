import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./src/i18n/config";

export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    messages: (await import(`./messages/${defaultLocale}.json`)).default as Record<string, unknown>,
  };
});

export const localeConfig = { locales: [...locales], defaultLocale };
