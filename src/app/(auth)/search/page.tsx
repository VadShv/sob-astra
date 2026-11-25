"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Input, Button, Table, Skeleton, Segmented, Tag, Drawer, Checkbox, Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Candidate } from "@/lib/api";
import s from "./search.module.css";

function buildColumns(): ColumnsType<Candidate> {
  return [
    {
      title: "Кандидат",
      dataIndex: "fullName",
      key: "fullName",
      render: (name: string, record: Candidate) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {record.email && (
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>{record.email}</div>
          )}
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
      title: "Должность",
      key: "position",
      render: (_: unknown, r: Candidate) => r.passport?.title || r.resume?.lastPosition || "—",
    },
    {
      title: "Источник",
      key: "source",
      render: (_: unknown, r: Candidate) => {
        const src = r.resume?.candidateSource?.name;
        return src ? <Tag>{src}</Tag> : "—";
      },
    },
    {
      title: "Метки",
      key: "tags",
      render: (_: unknown, r: Candidate) =>
        r.tags?.length ? (
          <Space size={4} wrap>
            {r.tags.map((t) => (
              <Tag key={t.id} color={t.color || "default"}>{t.name}</Tag>
            ))}
          </Space>
        ) : null,
    },
    {
      title: "В процессе",
      dataIndex: "activeProcessCount",
      key: "process",
      align: "center",
      render: (count: number) => count || "",
    },
  ];
}

export default function SearchPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["candidates", search],
    queryFn: () => appApi.getCandidates({ page: "1", pageSize: "20" }),
  });

  const { data: tags } = useQuery({
    queryKey: ["candidate-tags"],
    queryFn: () => appApi.getReferenceDictionary("candidateTags"),
  });

  const { data: sources } = useQuery({
    queryKey: ["candidate-sources"],
    queryFn: () => appApi.getReferenceDictionary("candidateSources"),
  });

  const { data: coldSearches } = useQuery({
    queryKey: ["cold-searches"],
    queryFn: () => appApi.getColdSearches(),
  });

  const items = data?.items ?? [];
  const tagValues = (tags as { values?: { code: string; name: string }[] })?.values ?? [];
  const sourceValues = (sources as { values?: { code: string; name: string }[] })?.values ?? [];
  const coldSearchItems = (coldSearches as { items?: unknown[] })?.items ?? [];

  return (
    <div className={s.page}>
      <PageHeader title="Поиск кандидатов" />

      <div className={s.searchPanel}>
        <Input.Search
          className={s.searchInput}
          placeholder="Ищем…"
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          enterButton={
            <Button type="primary" size="large">Найти</Button>
          }
        />
        <Button size="large" onClick={() => setFilterOpen(true)}>Фильтры</Button>
        <Button size="large" disabled={coldSearchItems.length === 0}>
          Поиски {coldSearchItems.length > 0 && `(${coldSearchItems.length})`}
        </Button>
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
            columns={buildColumns()}
            dataSource={items}
            rowKey="candidateId"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="middle"
          />
        )}
      </div>

      <Drawer
        title="Фильтры"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        width={320}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h4 style={{ marginBottom: 12 }}>Источники</h4>
            <Checkbox.Group>
              <Space direction="vertical">
                {sourceValues.map((src) => (
                  <Checkbox key={src.code} value={src.code}>{src.name}</Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>
          <div>
            <h4 style={{ marginBottom: 12 }}>Метики</h4>
            <Checkbox.Group>
              <Space direction="vertical">
                {tagValues.map((tag) => (
                  <Checkbox key={tag.code} value={tag.code}>{tag.name}</Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>
          <Button type="primary" block onClick={() => setFilterOpen(false)}>
            Применить
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
