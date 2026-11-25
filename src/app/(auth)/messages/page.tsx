"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Segmented, Skeleton, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi } from "@/lib/api";
import s from "./messages.module.css";

interface Conversation {
  candidacyId: string;
  candidateName: string;
  channel: string;
  lastMessage: string;
  waitingSince: string;
  action: string;
}

const columns: ColumnsType<Conversation> = [
  {
    title: "Кандидат",
    dataIndex: "candidateName",
    key: "candidateName",
  },
  {
    title: "Канал",
    dataIndex: "channel",
    key: "channel",
    render: (ch: string) => (ch ? <Tag>{ch}</Tag> : "—"),
  },
  {
    title: "Последнее сообщение",
    dataIndex: "lastMessage",
    key: "lastMessage",
    ellipsis: true,
  },
  {
    title: "Ждёт",
    dataIndex: "waitingSince",
    key: "waitingSince",
  },
  {
    title: "Действие",
    dataIndex: "action",
    key: "action",
  },
];

export default function MessagesPage() {
  const [tab, setTab] = useState("all");
  const [subTab, setSubTab] = useState("active");

  const { data, isLoading } = useQuery({
    queryKey: ["conversations-awaiting"],
    queryFn: () =>
      appApi.getConversationsAwaiting({ sort: "longest", page: "1", pageSize: "20" }),
  });

  const resp = data as
    | { items?: unknown[]; total?: number; counts?: { active: number; archive: number; calledHr: number } }
    | undefined;
  const items = (resp?.items ?? []) as Conversation[];
  const counts = resp?.counts ?? { active: 0, archive: 0, calledHr: 0 };

  return (
    <div className={s.page}>
      <PageHeader title="Сообщения" sub="Кандидаты, которые ждут ответа" />

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === "all" ? s.tabActive : ""}`}
          onClick={() => setTab("all")}
        >
          Все сообщения
        </button>
        <button
          className={`${s.tab} ${tab === "vacancy" ? s.tabActive : ""}`}
          onClick={() => setTab("vacancy")}
        >
          По вакансиям
        </button>
      </div>

      <div className={s.subTabs}>
        <Segmented
          options={[
            { label: `Активные (${counts.active})`, value: "active" },
            { label: `Архив (${counts.archive})`, value: "archive" },
          ]}
          value={subTab}
          onChange={(v) => setSubTab(v as string)}
          size="small"
        />
        <Button size="small">Фильтры</Button>
        <Button size="small" type="text">
          Только мои вакансии
        </Button>
        <Button size="small" type="text">
          Показывать сопроводительные
        </Button>
      </div>

      <div className={s.panel}>
        {isLoading ? (
          <Skeleton active />
        ) : items.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyTitle}>Никто не ждёт ответа</div>
            <div className={s.emptyHint}>
              В очереди — только кандидаты, написавшие за последние 30 дней.
            </div>
          </div>
        ) : (
          <Table<Conversation>
            columns={columns}
            dataSource={items}
            rowKey="candidacyId"
            pagination={false}
            size="middle"
          />
        )}
      </div>
    </div>
  );
}
