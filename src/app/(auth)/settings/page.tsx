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
  "Шаблоны скоркарт": "/settings/scorecard-templates",
  "Шаблоны офферов": "/settings/offer-templates",
  "Справочники": "/settings/dictionaries",
  "Кастомные поля": "/settings/custom-fields",
  "Теги": "/settings/tags",
  "Шаблоны сообщений": "/settings/templates",
  "Email-шаблоны": "/settings/email-templates",
  "Синхронизация календарей": "/settings/calendar-sync",
  "Внешний API": "/settings/api",
  "Логи вебхуков": "/settings/webhook-logs",
  "События вебхуков": "/settings/webhook-events",
  "Журнал действий": "/settings/audit-log",
  "Биллинг": "/settings/billing",
  "Воронки талантов": "/settings/pipelines",
  "GDPR": "/settings/gdpr",
  "Реферальная программа": "/settings/referral",
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
