"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Card, Table, Tag, Progress, Empty } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

export default function VacancyAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  usePageTitle("Аналитика · Вакансия");

  const { data: vacancy } = useQuery({
    queryKey: qk.vacancies.detail(id),
    queryFn: () => appApi.getVacancyById(id),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vacancy-analytics", id],
    queryFn: () => appApi.getVacancyAnalytics(id),
  });

  if (isError) {
    return (
      <div>
        <PageHeader title="Аналитика" />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Загрузка…" />
        <Skeleton active />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={vacancy?.title ?? "Аналитика"}
        sub="Аналитика по вакансии"
        actions={<a href={`/vacancy/${id}`}>← Вакансия</a>}
      />

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>Всего кандидатов</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{data.totalCandidates}</div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>Нанято</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#52c41a" }}>{data.hiredCount}</div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>Среднее время найма</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{data.avgTimeToHire ? `${data.avgTimeToHire} дн` : "—"}</div>
        </Card>
      </div>

      <Card title="Конверсия по этапам" style={{ marginBottom: 16 }}>
        {data.conversion.map((c) => (
          <div key={c.stage} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{c.stage}</span>
              <span style={{ color: "rgba(0,0,0,.45)" }}>{c.count} ({c.conversionRate.toFixed(1)}%)</span>
            </div>
            <Progress percent={c.conversionRate} size="small" strokeColor="#6B53D5" />
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", gap: 16 }}>
        <Card title="Среднее время на этапе" style={{ flex: 1 }}>
          <Table
            dataSource={data.timeInStage}
            rowKey="stage"
            pagination={false}
            size="small"
            columns={[
              { title: "Этап", dataIndex: "stage", key: "stage" },
              { title: "Дней", dataIndex: "avgDays", key: "avgDays", render: (v: number) => `${v.toFixed(1)} дн` },
            ]}
          />
        </Card>
        <Card title="Источники кандидатов" style={{ flex: 1 }}>
          <Table
            dataSource={data.sources}
            rowKey="source"
            pagination={false}
            size="small"
            columns={[
              { title: "Источник", dataIndex: "source", key: "source", render: (v: string) => <Tag>{v}</Tag> },
              { title: "Кандидатов", dataIndex: "count", key: "count" },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
