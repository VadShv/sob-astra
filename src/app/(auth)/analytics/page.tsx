"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Segmented, Skeleton } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi } from "@/lib/api";
import s from "./analytics.module.css";

interface SourceBreakdown {
  name: string;
  count: number;
  percent: number;
}

const SOURCES: SourceBreakdown[] = [
  { name: "Внешняя ссылка на интервью", count: 1, percent: 100 },
  { name: "hh.ru", count: 0, percent: 0 },
  { name: "Холодный поиск hh", count: 0, percent: 0 },
  { name: "Авито", count: 0, percent: 0 },
];

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  const [view, setView] = useState("diagram");
  return (
    <div className={s.funnelSection}>
      <div>
        <h3 className={s.funnelTitle}>{title}</h3>
        {desc && <p className={s.funnelDesc}>{desc}</p>}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Segmented
          options={["Диаграмма", "Таблица"]}
          value={view === "diagram" ? "Диаграмма" : "Таблица"}
          onChange={(v) => setView(v === "Диаграмма" ? "diagram" : "table")}
          size="small"
        />
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("Текущий квартал");

  const { data: kpi, isLoading } = useQuery({
    queryKey: ["hiring-kpi"],
    queryFn: () =>
      appApi.getHiringKpi({
        from: "2026-09-30T21:00:00.000Z",
        to: "2026-11-25T21:00:00.000Z",
        tzOffset: "-180",
      }),
  });

  return (
    <div className={s.page}>
      <PageHeader
        title="Аналитика найма"
        sub="Дашборд подбора"
        actions={
          <>
            <Button>Журнал выгрузок</Button>
            <Button type="primary">Выгрузить в Excel</Button>
          </>
        }
      />

      <div className={s.filters}>
        <Segmented
          options={["Текущий квартал", "Этот месяц", "Этот год"]}
          value={period}
          onChange={(v) => setPeriod(v as string)}
          size="small"
        />
        <Segmented options={["Все рекрутеры"]} size="small" />
        <Segmented options={["Все вакансии"]} size="small" />
      </div>

      <div style={{ fontSize: 14, color: "rgba(0,0,0,.65)" }}>
        {period} · Все рекрутеры · 6 вакансий · 1 кандидат
      </div>

      {isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <div className={s.kpiSection}>
            <h2 className={s.kpiTitle}>Что сделал ИИ</h2>
            <div className={s.kpiGrid}>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Экономия времени рекрутёра</span>
                <span className={s.kpiValue}>0 ч</span>
                <span className={s.kpiHint}>
                  Сколько заняла бы та же работа вручную.
                </span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Сэкономлено</span>
                <span className={s.kpiValue}>0 ч</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Резюме разобрано ИИ</span>
                <span className={s.kpiValue}>0</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Интервью ИИ проведено</span>
                <span className={s.kpiValue}>0</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Одобрено кандидатов</span>
                <span className={s.kpiValue}>0</span>
              </div>
            </div>
          </div>

          <Section
            title="Вклад в наймы"
            desc="Откуда приходят кандидаты"
          >
            <p style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginBottom: 16 }}>
              Кандидаты с hh и Авито; остальные пришли по ссылке на интервью.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SOURCES.map((src) => (
                <div
                  key={src.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14 }}>{src.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: src.percent > 0 ? "#6b53d5" : "rgba(0,0,0,.45)" }}>
                    {src.percent}%
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)", minWidth: 100 }}>
                    {src.count} {src.count === 1 ? "кандидат" : "кандидатов"}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Эффективность"
            desc="Какие источники лучше конвертируют"
          >
            <p style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
              Доля одобренных ИИ среди кандидатов источника.
            </p>
          </Section>

          <Section
            title="Причины отказов"
            desc="Почему процесс заканчивается отказом"
          >
            <p style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
              Отказы по резюме и по итогам интервью за период: кто отказал — ИИ
              или рекрутёр — и на каком этапе.
            </p>
            <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
              За этот период отказов не было.
            </div>
          </Section>

          <Section
            title="Команда"
            desc="Рекрутеры: воронка по их вакансиям"
          >
            <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
              Нет данных за период
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
