"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Table, Tag, Button, Skeleton, Segmented, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi, type Requisition } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./requisitions.module.css";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  cancelled: "default",
};

export default function RequisitionsPage() {
  const router = useRouter();
  usePageTitle("Заявки на найм");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...qk.requisitions.all(), statusFilter, page, pageSize],
    queryFn: () => appApi.getRequisitions({
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      page: String(page),
      pageSize: String(pageSize),
    }),
    placeholderData: keepPreviousData,
  });

  const { data: summary } = useQuery({
    queryKey: qk.requisitions.summary(),
    queryFn: () => appApi.getRequisitionSummary(),
  });

  const items = data?.items ?? [];

  const columns: ColumnsType<Requisition> = [
    { title: "Должность", dataIndex: "title", key: "title" },
    { title: "Отдел", dataIndex: "department", key: "department", render: (v: string) => v || "—" },
    { title: "Позиция", dataIndex: "position", key: "position", render: (v: string) => v || "—" },
    { title: "Найм", dataIndex: "plannedHires", key: "plannedHires" },
    {
      title: "Зарплата",
      key: "salary",
      render: (_, r) => r.salaryFrom || r.salaryTo ? `${r.salaryFrom ?? "—"}–${r.salaryTo ?? "—"}` : "—",
    },
    { title: "Автор", dataIndex: "author", key: "author", render: (v: { name: string }) => v?.name || "—" },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={STATUS_COLORS[v] || "default"}>{v}</Tag>,
    },
    { title: "Создана", dataIndex: "createdAt", key: "createdAt", render: (v: string) => new Date(v).toLocaleDateString("ru-RU") },
  ];

  return (
    <div className={s.page}>
      <PageHeader title="Заявки на найм" sub="Заявки на открытие вакансий" />

      {summary && (
        <div className={s.tiles}>
          <Tag>Всего: {summary.total}</Tag>
          <Tag color="orange">Ожидают: {summary.pending}</Tag>
          <Tag color="green">Одобрены: {summary.approved}</Tag>
          <Tag color="red">Отклонены: {summary.rejected}</Tag>
        </div>
      )}

      <div className={s.panel}>
        <div className={s.filters}>
          <Segmented
            options={[
              { label: "Все", value: "all" },
              { label: "Ожидают", value: "pending" },
              { label: "Одобрены", value: "approved" },
              { label: "Отклонены", value: "rejected" },
              { label: "Отменены", value: "cancelled" },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v as string); setPage(1); }}
          />
          <Button type="primary" onClick={() => router.push("/requisitions/new")}>Создать заявку</Button>
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <Skeleton active />
        ) : (
          <Table<Requisition>
            columns={columns}
            dataSource={items}
            rowKey="id"
            locale={{ emptyText: "Нет заявок" }}
            onRow={(record) => ({
              onClick: () => router.push(`/requisitions/${record.id}`),
              style: { cursor: "pointer" },
            })}
            pagination={{
              current: page,
              pageSize,
              total: data?.total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
          />
        )}
      </div>
    </div>
  );
}
