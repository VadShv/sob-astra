"use client";

import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/components/usePageTitle";
import { Tag } from "antd";

const UPDATES = [
  {
    date: "25 ноября 2026",
    title: "Аналитика найма",
    tags: ["Аналитика", "Новое"],
    body: "Дашборд подбора: KPI за период, вклад источников, эффективность и причины отказов. Выгрузка в Excel.",
  },
  {
    date: "20 ноября 2026",
    title: "Интервью ИИ",
    tags: ["ИИ", "Улучшение"],
    body: "ИИ-интервью стало точнее: новые вопросы по техническим навыкам, автоматическая оценка soft skills.",
  },
  {
    date: "15 ноября 2026",
    title: "Холодный поиск hh.ru",
    tags: ["hh.ru", "Новое"],
    body: "Автоматический поиск кандидатов на hh.ru по заданным критериям. ИИ отбирает подходящие резюме.",
  },
  {
    date: "10 ноября 2026",
    title: "Шаблоны сообщений",
    tags: ["Сообщения", "Улучшение"],
    body: "Создавайте шаблоны сообщений с переменными. Используйте для приглашений, отказов и напоминаний.",
  },
  {
    date: "5 ноября 2026",
    title: "Роли и права",
    tags: ["Настройки", "Новое"],
    body: "Гибкая система ролей: настраивайте права для каждой роли — какие вакансии и действия доступны.",
  },
];

export default function WhatsNewPage() {
  usePageTitle("Что нового");
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 0" }}>
      <PageHeader title="Что нового" sub="Обновления и улучшения" />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {UPDATES.map((u, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginBottom: 8 }}>
              {u.date}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{u.title}</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {u.tags.map((t) => (
                <Tag key={t} color={t === "Новое" ? "green" : t === "ИИ" ? "purple" : "default"}>
                  {t}
                </Tag>
              ))}
            </div>
            <p style={{ fontSize: 14, color: "rgba(0,0,0,.65)", lineHeight: 1.6 }}>
              {u.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
