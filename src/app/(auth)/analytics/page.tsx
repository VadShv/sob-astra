"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Segmented, Skeleton, message } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type HiringKpi } from "@/lib/api";
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

function getPeriodRange(period: string): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (period === "Текущий квартал") from.setMonth(from.getMonth() - 3);
  else if (period === "Этот месяц") from.setMonth(from.getMonth() - 1);
  else if (period === "Этот год") from.setFullYear(from.getFullYear() - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

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
  const range = getPeriodRange(period);

  const { data: kpi, isLoading } = useQuery({
    queryKey: ["hiring-kpi", period],
    queryFn: () =>
      appApi.getHiringKpi({
        from: range.from,
        to: range.to,
        tzOffset: "-180",
      }),
  });

  const kpiData = kpi as HiringKpi | undefined;
  const ttf = kpiData?.timeToFill;
  const tto = kpiData?.timeToOffer;
  const oa = kpiData?.offerAcceptance;
  const speed = kpiData?.hiringSpeed;

  return (
    <div className={s.page}>
      <PageHeader
        title="Аналитика найма"
        sub="Дашборд подбора"
        actions={
          <>
            <Button onClick={() => message.info("Журнал выгрузок — в разработке")}>
              Журнал выгрузок
            </Button>
            <Button type="primary" onClick={() => message.info("Выгрузка Excel — в разработке")}>
              Выгрузить в Excel
            </Button>
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
        {isLoading ? (
          "Считаем…"
        ) : (
          <>
            {period} · Все рекрутеры · {ttf?.vacancies ?? 0} вакансий · {speed?.points?.length ?? 0} периодов
          </>
        )}
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
                <span className={s.kpiHint}>Сколько заняла бы та же работа вручную.</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Дней до найма</span>
                <span className={s.kpiValue}>{ttf?.medianDays ?? "—"}</span>
                <span className={s.kpiHint}>медиана по {ttf?.vacancies ?? 0} вакансиям</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Дней до оффера</span>
                <span className={s.kpiValue}>{tto?.medianDays ?? "—"}</span>
                <span className={s.kpiHint}>{tto?.offers ?? 0} офферов</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Приём офферов</span>
                <span className={s.kpiValue}>
                  {oa?.rate != null ? `${Math.round(oa.rate * 100)}%` : "—"}
                </span>
                <span className={s.kpiHint}>
                  {oa?.accepted ?? 0} принято · {oa?.declined ?? 0} отклонено
                </span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Резюме разобрано ИИ</span>
                <span className={s.kpiValue}>0</span>
              </div>
              <div className={s.kpiCard}>
                <span className={s.kpiLabel}>Интервью ИИ проведено</span>
                <span className={s.kpiValue}>0</span>
              </div>
            </div>
          </div>

          <Section title="Вклад в наймы" desc="Откуда приходят кандидаты">
            <p style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginBottom: 16 }}>
              Кандидаты с hh и Авито; остальные пришли по ссылке на интервью.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SOURCES.map((src) => (
                <div key={src.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

          <Section title="Эффективность" desc="Какие источники лучше конвертируют">
            <p style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
              Доля одобренных ИИ среди кандидатов источника.
            </p>
          </Section>

          <Section title="Причины отказов" desc="Почему процесс заканчивается отказом">
            <p style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
              Отказы по резюме и по итогам интервью за период: кто отказал — ИИ или
              рекрутёр — и на каком этапе.
            </p>
            <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
              За этот период отказов не было.
            </div>
          </Section>

          <Section title="Команда" desc="Рекрутеры: воронка по их вакансиям">
            <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
              Нет данных за период
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
