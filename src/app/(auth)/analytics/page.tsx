"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button, Segmented, Skeleton, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type HiringKpi } from "@/lib/api";
import s from "./analytics.module.css";

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
  tableColumns,
  tableData,
  diagram,
}: {
  title: string;
  desc?: string;
  tableColumns?: ColumnsType<Record<string, unknown>>;
  tableData?: Record<string, unknown>[];
  diagram: React.ReactNode;
}) {
  const [view, setView] = useState<"diagram" | "table">("diagram");
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
      {view === "diagram" || !tableColumns || !tableData ? (
        diagram
      ) : (
        <Table
          columns={tableColumns}
          dataSource={tableData}
          rowKey={(_, i) => String(i)}
          pagination={false}
          size="small"
        />
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("Текущий квартал");
  const range = getPeriodRange(period);
  const params = { from: range.from, to: range.to, tzOffset: "-180" };

  const { data: kpi, isLoading } = useQuery({
    queryKey: ["hiring-kpi", period],
    queryFn: () => appApi.getHiringKpi(params),
  });

  const { data: sourceData } = useQuery({
    queryKey: ["analytics-source-breakdown", period],
    queryFn: () => appApi.getAnalyticsSourceBreakdown(params),
  });

  const { data: rejectionData } = useQuery({
    queryKey: ["analytics-rejection-reasons", period],
    queryFn: () => appApi.getAnalyticsRejectionReasons(params),
  });

  const { data: teamData } = useQuery({
    queryKey: ["analytics-team-funnels", period],
    queryFn: () => appApi.getAnalyticsTeamFunnels(params),
  });

  const exportMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.exportAnalyticsExcel(payload),
    onSuccess: (resp) => {
      if (resp.url) window.open(resp.url, "_blank");
      else message.success("Экспорт готовится");
    },
    onError: () => message.error("Не удалось выгрузить"),
  });

  const kpiData = kpi as HiringKpi | undefined;
  const ttf = kpiData?.timeToFill;
  const tto = kpiData?.timeToOffer;
  const oa = kpiData?.offerAcceptance;

  const sources = (sourceData as { items?: Array<{ name: string; count: number; percent: number }> })?.items ?? [];
  const rejections = (rejectionData as { items?: Array<{ reason: string; count: number; stage: string; who: string }> })?.items ?? [];
  const team = (teamData as { items?: Array<{ recruiterId: string; recruiterName: string; vacancies: number; candidates: number; hired: number }> })?.items ?? [];

  const sourceColumns: ColumnsType<Record<string, unknown>> = [
    { title: "Источник", dataIndex: "name", key: "name" },
    { title: "Кандидатов", dataIndex: "count", key: "count", align: "center" },
    { title: "Доля", dataIndex: "percent", key: "percent", align: "center", render: (p: number) => `${p}%` },
  ];

  const rejectionColumns: ColumnsType<Record<string, unknown>> = [
    { title: "Причина", dataIndex: "reason", key: "reason" },
    { title: "Количество", dataIndex: "count", key: "count", align: "center" },
    { title: "Этап", dataIndex: "stage", key: "stage" },
    { title: "Кто отказал", dataIndex: "who", key: "who" },
  ];

  const teamColumns: ColumnsType<Record<string, unknown>> = [
    { title: "Рекрутер", dataIndex: "recruiterName", key: "recruiterName" },
    { title: "Вакансий", dataIndex: "vacancies", key: "vacancies", align: "center" },
    { title: "Кандидатов", dataIndex: "candidates", key: "candidates", align: "center" },
    { title: "Нанято", dataIndex: "hired", key: "hired", align: "center", render: (h: number) => h || "" },
  ];

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
            <Button
              type="primary"
              loading={exportMut.isPending}
              onClick={() => exportMut.mutate(params)}
            >
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
      </div>

      <div style={{ fontSize: 14, color: "rgba(0,0,0,.65)" }}>
        {isLoading ? "Считаем…" : `${period} · ${ttf?.vacancies ?? 0} вакансий`}
      </div>

      {isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <div className={s.kpiSection}>
            <h2 className={s.kpiTitle}>Что сделал ИИ</h2>
            <div className={s.kpiGrid}>
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
            </div>
          </div>

          <Section
            title="Вклад в наймы"
            desc="Откуда приходят кандидаты"
            tableColumns={sourceColumns}
            tableData={sources as unknown as Record<string, unknown>[]}
            diagram={
              sources.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>Нет данных за период</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {sources.map((src) => (
                    <div key={src.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ flex: 1, fontSize: 14 }}>{src.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: src.percent > 0 ? "#6b53d5" : "rgba(0,0,0,.45)" }}>
                        {src.percent}%
                      </span>
                      <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)", minWidth: 100 }}>
                        {src.count} кандидатов
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          />

          <Section
            title="Причины отказов"
            desc="Почему процесс заканчивается отказом"
            tableColumns={rejectionColumns}
            tableData={rejections as unknown as Record<string, unknown>[]}
            diagram={
              rejections.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
                  За этот период отказов не было.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rejections.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{r.reason}</span>
                      <Tag>{r.count}</Tag>
                    </div>
                  ))}
                </div>
              )
            }
          />

          <Section
            title="Команда"
            desc="Рекрутеры: воронка по их вакансиям"
            tableColumns={teamColumns}
            tableData={team as unknown as Record<string, unknown>[]}
            diagram={
              team.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
                  Нет данных за период
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {team.map((t) => (
                    <div key={t.recruiterId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <span style={{ flex: 1, fontWeight: 600 }}>{t.recruiterName}</span>
                      <Tag>{t.vacancies} вак.</Tag>
                      <Tag>{t.candidates} канд.</Tag>
                      {t.hired > 0 && <Tag color="green">{t.hired} наймов</Tag>}
                    </div>
                  ))}
                </div>
              )
            }
          />
        </>
      )}
    </div>
  );
}
