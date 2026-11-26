"use client";

import { type ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import s from "./settings-layout.module.css";

interface SettingsSection {
  group: string;
  items: { label: string; desc: string }[];
}

const SECTIONS: SettingsSection[] = [
  {
    group: "Личное",
    items: [
      { label: "Учётная запись", desc: "Имя, пароль, язык, часовой пояс и безопасность" },
      { label: "Уведомления", desc: "Какие события присылать письмом на почту" },
    ],
  },
  {
    group: "Компания и люди",
    items: [
      { label: "Компания", desc: "Реквизиты, регион и рабочее пространство" },
      { label: "Оформление интервью", desc: "Цвета и картинки страницы интервью кандидата" },
      { label: "Пользователи", desc: "Приглашения, роли и доступ сотрудников" },
      { label: "Роли и права", desc: "Что может каждая роль и на каких вакансиях" },
      { label: "Команды", desc: "Подразделения и команды сотрудников" },
    ],
  },
  {
    group: "Процессы найма",
    items: [
      { label: "Воронки", desc: "Каталог этапов и шаблоны воронок" },
      { label: "Шаблоны скоркарт", desc: "Шаблоны для оценки интервью" },
      { label: "Шаблоны офферов", desc: "Шаблоны оффер-писем" },
      { label: "Справочники", desc: "Справочные значения: регионы, грейды, источники" },
      { label: "Кастомные поля", desc: "Дополнительные поля для вакансий и кандидатов" },
      { label: "Теги", desc: "Теги кандидатов: цвета, категории" },
    ],
  },
  {
    group: "Инструменты",
    items: [
      { label: "Шаблоны сообщений", desc: "Шаблоны сообщений кандидату" },
      { label: "Email-шаблоны", desc: "Email-шаблоны с переменными и предпросмотром" },
      { label: "Синхронизация календарей", desc: "Google и Outlook календари" },
      { label: "Внешний API", desc: "API-токены и webhooks для интеграций" },
      { label: "Логи вебхуков", desc: "История вызовов вебхуков" },
      { label: "Журнал действий", desc: "История изменений и действий пользователей" },
    ],
  },
  {
    group: "",
    items: [
      { label: "Интеграции", desc: "Работные сайты, почта, мессенджеры и календари" },
    ],
  },
];

export function SettingsLayout({
  activeItem,
  children,
}: {
  activeItem: string;
  children: ReactNode;
}) {
  return (
    <div>
      <PageHeader title="Все настройки" sub="Рабочее пространство, люди и процессы" />
      <div className={s.page}>
        <nav className={s.sideNav}>
          {SECTIONS.map((section, i) => (
            <div key={i} className={s.sideGroup}>
              {section.group && <div className={s.sideGroupTitle}>{section.group}</div>}
              {section.items.map((item) => (
                <a
                  key={item.label}
                  className={`${s.sideItem} ${activeItem === item.label ? s.sideItemActive : ""}`}
                  href={
                    {
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
                      "Журнал действий": "/settings/audit-log",
                      "Интеграции": "/settings/integrations",
                    }[item.label] || "/settings"
                  }
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className={s.content}>{children}</div>
      </div>
    </div>
  );
}

export { SECTIONS };
