import { notFound } from "next/navigation";

export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export function getLocale(): Locale {
  return defaultLocale;
}

export async function getMessages(locale: Locale) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }
}
