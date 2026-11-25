"use client";

import { useState } from "react";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { Button, Segmented, Skeleton, Table, Tag, message, Modal, Select, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type HiringKpi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
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
  usePageTitle("Аналитика найма");
  const [exportLogOpen, setExportLogOpen] = useState(false);
  const [recruiterId, setRecruiterId] = useState<string>("");
  const [vacancyId, setVacancyId] = useState<string>("");
  const [customRange, setCustomRange] = useState<[string, string] | null>(null);
  const range = customRange
    ? { from: new Date(customRange[0]).toISOString(), to: new Date(customRange[1]).toISOString() }
    : getPeriodRange(period);
  const params = { from: range.from, to: range.to, tzOffset: "-180", ...(recruiterId ? { recruiterId } : {}), ...(vacancyId ? { vacancyId } : {}) };

  const { data: facets } = useQuery({
    queryKey: qk.vacancies.facets(),
    queryFn: () => appApi.getVacancyFacets({ status: "active,paused,distribution" }),
  });

  const { data: allVacancies } = useQuery({
    queryKey: qk.vacancies.forFilter(),
    queryFn: () => appApi.getVacancies({ status: "active,paused,distribution", page: "1", pageSize: "100" }),
  });

  const { data: kpi, isLoading, isError, refetch } = useQuery({
    queryKey: qk.analytics.kpi(period, recruiterId, vacancyId),
    queryFn: () => appApi.getHiringKpi(params),
    placeholderData: keepPreviousData,
  });

  const { data: sourceData } = useQuery({
    queryKey: qk.analytics.sourceBreakdown(period, recruiterId, vacancyId),
    queryFn: () => appApi.getAnalyticsSourceBreakdown(params),
    placeholderData: keepPreviousData,
  });

  const { data: rejectionData } = useQuery({
    queryKey: qk.analytics.rejectionReasons(period, recruiterId, vacancyId),
    queryFn: () => appApi.getAnalyticsRejectionReasons(params),
    placeholderData: keepPreviousData,
  });

  const { data: teamData } = useQuery({
    queryKey: qk.analytics.teamFunnels(period, recruiterId, vacancyId),
    queryFn: () => appApi.getAnalyticsTeamFunnels(params),
    placeholderData: keepPreviousData,
  });

  const { data: exportLog } = useQuery({
    queryKey: qk.analytics.exportLog(),
    queryFn: () => appApi.getExportLog(),
    enabled: exportLogOpen,
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
            <Button onClick={() => setExportLogOpen(true)}>
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

      <div className={s.filters} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Segmented
          options={["Текущий квартал", "Этот месяц", "Этот год", "Свой период"]}
          value={period}
          onChange={(v) => { setPeriod(v as string); if (v !== "Свой период") setCustomRange(null); }}
          size="small"
        />
        {period === "Свой период" && (
          <DatePicker.RangePicker
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) setCustomRange([dateStrings[0], dateStrings[1]]);
            }}
            size="small"
            format="DD.MM.YYYY"
          />
        )}
        <Select
          placeholder="Все рекрутеры"
          allowClear
          style={{ width: 180 }}
          options={(facets?.recruiters ?? []).map((r) => ({ value: r.id, label: r.name }))}
          value={recruiterId || undefined}
          onChange={(v) => setRecruiterId(v ?? "")}
          size="small"
        />
        <Select
          placeholder="Все вакансии"
          allowClear
          showSearch
          style={{ width: 220 }}
          options={(allVacancies?.items ?? []).map((v) => ({ value: v.id, label: v.title }))}
          value={vacancyId || undefined}
          onChange={(v) => setVacancyId(v ?? "")}
          size="small"
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
        />
      </div>

      <div style={{ fontSize: 14, color: "rgba(0,0,0,.65)" }}>
        {isLoading ? "Считаем…" : `${period} · ${ttf?.vacancies ?? 0} вакансий`}
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
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
            title="Эффективность"
            desc="Конверсия кандидатов по рекрутерам"
            tableColumns={[
              { title: "Рекрутер", dataIndex: "recruiterName", key: "recruiterName" },
              { title: "Вакансий", dataIndex: "vacancies", key: "vacancies", align: "center" as const },
              { title: "Кандидатов", dataIndex: "candidates", key: "candidates", align: "center" as const },
              { title: "Нанято", dataIndex: "hired", key: "hired", align: "center" as const },
              {
                title: "Конверсия",
                key: "conversion",
                align: "center" as const,
                render: (_: unknown, r: Record<string, unknown>) => {
                  const candidates = r.candidates as number ?? 0;
                  const hired = r.hired as number ?? 0;
                  const rate = candidates > 0 ? Math.round((hired / candidates) * 100) : 0;
                  return <Tag color={rate > 10 ? "green" : rate > 0 ? "orange" : "default"}>{rate}%</Tag>;
                },
              },
            ]}
            tableData={team as unknown as Record<string, unknown>[]}
            diagram={
              team.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
                  Нет данных за период
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {team.map((t) => {
                    const rate = t.candidates > 0 ? Math.round((t.hired / t.candidates) * 100) : 0;
                    return (
                      <div key={t.recruiterId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                        <span style={{ flex: 1, fontWeight: 600 }}>{t.recruiterName}</span>
                        <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>{t.candidates} канд.</span>
                        <Tag color={rate > 10 ? "green" : rate > 0 ? "orange" : "default"}>{rate}%</Tag>
                      </div>
                    );
                  })}
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

      <Modal
        title="Журнал выгрузок"
        open={exportLogOpen}
        onCancel={() => setExportLogOpen(false)}
        footer={null}
        width={600}
      >
        <Table
          dataSource={exportLog?.items ?? []}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: "Тип", dataIndex: "type", key: "type" },
            { title: "Дата", dataIndex: "createdAt", key: "createdAt", render: (d: string) => new Date(d).toLocaleString("ru-RU") },
            { title: "Статус", dataIndex: "status", key: "status", render: (s: string) => <Tag color={s === "done" ? "green" : "default"}>{s}</Tag> },
          ]}
          locale={{ emptyText: "Нет выгрузок" }}
        />
      </Modal>
    </div>
  );
}
