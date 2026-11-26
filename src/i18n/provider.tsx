"use client";

import { NextIntlClientProvider } from "next-intl";
import { type ReactNode } from "react";
import ruRU from "antd/locale/ru_RU";
import { getLocale, getMessages } from "./config";

export async function I18nProvider({ children }: { children: ReactNode }) {
  const locale = getLocale();
  const messages = await getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
