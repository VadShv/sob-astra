"use client";

import { useQuery } from "@tanstack/react-query";
import { Input, Button, Table, Skeleton, Segmented } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Candidate } from "@/lib/api";
import s from "./search.module.css";

const columns: ColumnsType<Candidate> = [
  {
    title: "Кандидат",
    dataIndex: "fullName",
    key: "fullName",
    render: (name: string, record: Candidate) => (
      <div>
        <div style={{ fontWeight: 600 }}>{name}</div>
        {record.email && <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>{record.email}</div>}
      </div>
    ),
  },
  {
    title: "Телефон",
    dataIndex: "phone",
    key: "phone",
    render: (phone: string) => phone || "—",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (email: string) => email || "—",
  },
];

export default function SearchPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => appApi.getCandidates({ page: "1", pageSize: "20" }),
  });

  const items = data?.items ?? [];

  return (
    <div className={s.page}>
      <PageHeader title="Поиск кандидатов" />

      <div className={s.searchPanel}>
        <Input.Search
          className={s.searchInput}
          placeholder="Ищем…"
          size="large"
          enterButton={
            <Button type="primary" size="large">
              Найти
            </Button>
          }
        />
        <Button size="large">Фильтры</Button>
        <Button size="large">Поиски</Button>
        <Button size="large" type="primary" className={s.aiButton}>
          Найти с ИИ
        </Button>
        <Button size="large" type="primary">
          Добавить кандидата
        </Button>
      </div>

      <div className={s.results}>
        <div className={s.resultControls}>
          <Segmented
            options={["Сначала недавно обновлённые", "Сначала давно обновлённые"]}
            size="small"
          />
          <span style={{ color: "rgba(0,0,0,.65)", fontSize: 14 }}>
            {items.length} резюме
          </span>
        </div>
        {isLoading ? (
          <Skeleton active />
        ) : (
          <Table<Candidate>
            columns={columns}
            dataSource={items}
            rowKey="candidateId"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="middle"
          />
        )}
      </div>
    </div>
  );
}
