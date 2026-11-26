"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Tag, Table, Button, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi, type Interview } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "blue", completed: "green", cancelled: "red", no_show: "orange", draft: "default",
};
const STATUS_LABELS: Record<string, string> = {
  scheduled: "Запланировано", completed: "Проведено", cancelled: "Отменено", no_show: "Неявка", draft: "Черновик",
};

export default function CandidateInterviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  usePageTitle("Интервью · Кандидат");

  const { data: candidate } = useQuery({
    queryKey: qk.candidates.detail(id),
    queryFn: () => appApi.getCandidateById(id),
  });

  const { data: interviewsData, isLoading, isError, refetch } = useQuery({
    queryKey: qk.candidates.interviews(id),
    queryFn: () => appApi.getCandidateInterviews(id),
  });

  const interviews = interviewsData?.items ?? [];

  const columns: ColumnsType<typeof interviews[number]> = [
    {
      title: "Вакансия",
      key: "vacancy",
      render: (_, r) => r.vacancyTitle || "—",
    },
    {
      title: "Тип",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Дата",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      width: 180,
      render: (v: string) => v ? new Date(v).toLocaleString("ru-RU") : "—",
    },
    {
      title: "Интервьюеры",
      dataIndex: "interviewerNames",
      key: "interviewerNames",
      render: (names: string[]) => names?.join(", ") || "—",
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || "default"}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: "Оценка",
      dataIndex: "rating",
      key: "rating",
      width: 80,
      render: (v?: number) => v ? `${v}/5` : "—",
    },
  ];

  return (
    <div>
      <PageHeader
        title={candidate?.fullName ?? "Интервью"}
        sub="История интервью по всем вакансиям"
        actions={<Button href={`/candidate/${id}`}>← Профиль</Button>}
      />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          columns={columns}
          dataSource={interviews}
          rowKey="interviewId"
          locale={{ emptyText: "Нет интервью" }}
          pagination={false}
        />
      )}
    </div>
  );
}
