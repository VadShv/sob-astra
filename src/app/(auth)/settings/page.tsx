"use client";

import Link from "next/link";
import { SettingsLayout, SECTIONS } from "@/components/SettingsLayout";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./settings.module.css";

const HREFS: Record<string, string> = {
  "Учётная запись": "/settings/account",
  "Уведомления": "/settings/notifications",
  "Компания": "/settings/company",
  "Оформление интервью": "/settings/appearance",
  "Пользователи": "/settings/users",
  "Роли и права": "/settings/roles",
  "Команды": "/settings/teams",
  "Воронки": "/settings/funnels",
  "Справочники": "/settings/dictionaries",
  "Шаблоны сообщений": "/settings/templates",
  "Внешний API": "/settings/api",
  "Журнал действий": "/settings/audit-log",
  "Интеграции": "/settings/integrations",
};

export default function SettingsPage() {
  usePageTitle("Настройки");
  return (
    <SettingsLayout activeItem="">
      {SECTIONS.flatMap((section) => section.items).map((item) => (
        <Link key={item.label} href={HREFS[item.label] ?? "/settings"} className={s.card}>
          <div className={s.cardTitle}>{item.label}</div>
          <div className={s.cardDesc}>{item.desc}</div>
        </Link>
      ))}
    </SettingsLayout>
  );
}
