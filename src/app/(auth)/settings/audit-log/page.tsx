"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Input, Select, Skeleton, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  entityName?: string;
  userId: string;
  userName: string;
  details?: Record<string, unknown>;
  createdAt: string;
  ip?: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "green",
  update: "blue",
  delete: "red",
  archive: "orange",
  move: "purple",
  login: "cyan",
  logout: "default",
};

export default function AuditLogPage() {
  usePageTitle("Журнал действий · Настройки");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState<string>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.audit.list({ page: String(page), pageSize: "50", entity: entity ?? "" }),
    queryFn: () =>
      appApi.getAuditLog({
        page: String(page),
        pageSize: "50",
        entity,
      }),
  });

  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: "Дата",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (val: string) => (
        <Tooltip title={new Date(val).toLocaleString("ru-RU")}>
          {new Date(val).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Tooltip>
      ),
    },
    {
      title: "Пользователь",
      dataIndex: "userName",
      key: "userName",
      width: 180,
    },
    {
      title: "Действие",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (val: string) => (
        <Tag color={ACTION_COLORS[val] ?? "default"}>{val}</Tag>
      ),
    },
    {
      title: "Объект",
      key: "entity",
      width: 200,
      render: (_, record) => (
        <span>
          <Tag>{record.entity}</Tag>
          {record.entityName ?? record.entityId}
        </span>
      ),
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      width: 140,
      render: (val?: string) => val ?? "—",
    },
  ];

  const items = data?.items ?? [];
  const filtered = search
    ? items.filter(
        (i) =>
          i.userName.toLowerCase().includes(search.toLowerCase()) ||
          i.entityName?.toLowerCase().includes(search.toLowerCase()) ||
          i.action.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <SettingsLayout activeItem="Журнал действий">
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="Поиск по пользователю или действию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 300 }}
        />
        <Select
          placeholder="Тип объекта"
          allowClear
          value={entity}
          onChange={(v) => setEntity(v)}
          style={{ width: 200 }}
          options={[
            { value: "vacancy", label: "Вакансия" },
            { value: "candidate", label: "Кандидат" },
            { value: "candidacy", label: "Кандидатура" },
            { value: "user", label: "Пользователь" },
            { value: "role", label: "Роль" },
            { value: "funnel", label: "Воронка" },
            { value: "requisition", label: "Заявка" },
          ]}
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          size="small"
          pagination={{
            current: page,
            pageSize: 50,
            total: data?.total ?? 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      )}
    </SettingsLayout>
  );
}
