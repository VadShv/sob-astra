"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Input, Button, Table, Skeleton, Segmented, Tag, Drawer, Checkbox, Space, message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Candidate } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
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
  const router = useRouter();
  const qc = useQueryClient();
  usePageTitle("Поиск кандидатов");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [aiResults, setAiResults] = useState<Candidate[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedSearchOpen, setSavedSearchOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedSources, selectedTags, sort]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.candidates.list(debouncedSearch, selectedSources, selectedTags, sort, page, pageSize),
    queryFn: ({ signal }) => {
      const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
      if (debouncedSearch) params.q = debouncedSearch;
      if (selectedSources.length) params.sources = selectedSources.join(",");
      if (selectedTags.length) params.tags = selectedTags.join(",");
      if (sort === "old") params.sortBy = "createdAt";
      return appApi.getCandidates(params, signal);
    },
    placeholderData: keepPreviousData,
  });

  const { data: tags } = useQuery({
    queryKey: qk.candidates.tags(),
    queryFn: () => appApi.getReferenceDictionary("candidateTags"),
    staleTime: 300_000,
  });

  const { data: sources } = useQuery({
    queryKey: qk.candidates.sources(),
    queryFn: () => appApi.getReferenceDictionary("candidateSources"),
    staleTime: 300_000,
  });

  const { data: coldSearches } = useQuery({
    queryKey: qk.search.cold(),
    queryFn: () => appApi.getColdSearches(),
    staleTime: 300_000,
  });

  const { data: savedSearches } = useQuery({
    queryKey: qk.search.saved(),
    queryFn: () => appApi.getSavedSearches(),
  });

  const deleteSearchMut = useMutation({
    mutationFn: (id: string) => appApi.deleteSavedSearch(id),
    onSuccess: () => {
      message.success("Поиск удалён");
      qc.invalidateQueries({ queryKey: qk.search.saved() });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const exportMut = useMutation({
    mutationFn: () => appApi.exportCandidates({ q: debouncedSearch }),
    onSuccess: (resp) => { if (resp.url) window.open(resp.url, "_blank"); },
    onError: () => message.error("Не удалось выгрузить"),
  });

  const items = aiResults ?? data?.items ?? [];
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
          loading={isLoading && !!debouncedSearch}
          enterButton={<Button type="primary" size="large">Найти</Button>}
        />
        <Button size="large" onClick={() => setFilterOpen(true)}>
          Фильтры
          {(selectedSources.length + selectedTags.length) > 0 && (
            <Tag color="purple" style={{ marginLeft: 6 }}>
              {selectedSources.length + selectedTags.length}
            </Tag>
          )}
        </Button>
        <Button
          size="large"
          onClick={() => setSavedSearchOpen(true)}
        >
          Поиски {coldSearchItems.length > 0 && `(${coldSearchItems.length})`}
        </Button>
        <Button
          size="large"
          type="primary"
          className={s.aiButton}
          loading={aiLoading}
          onClick={async () => {
            if (!debouncedSearch) { message.info("Введите запрос для AI-поиска"); return; }
            setAiLoading(true);
            try {
              const resp = await appApi.searchCandidatesAI({ query: debouncedSearch });
              setAiResults(resp.items);
              message.success(`Найдено ${resp.items.length} кандидатов`);
            } catch { message.error("AI-поиск недоступен"); }
            setAiLoading(false);
          }}
        >
          Найти с ИИ
        </Button>
        <Button
          size="large"
          type="primary"
          onClick={() => router.push("/candidate/new?back=/search")}
        >
          Добавить кандидата
        </Button>
        <Button
          size="large"
          loading={exportMut.isPending}
          onClick={() => exportMut.mutate()}
        >
          Экспорт
        </Button>
        {selectedIds.length >= 2 && (
          <Button
            size="large"
            type="primary"
            onClick={() => router.push(`/candidate/compare?ids=${selectedIds.join(",")}`)}
          >
            Сравнить ({selectedIds.length})
          </Button>
        )}
      </div>

      <div className={s.results}>
        <div className={s.resultControls}>
          <Segmented
            options={[
              { label: "Сначала недавно обновлённые", value: "recent" },
              { label: "Сначала давно обновлённые", value: "old" },
            ]}
            value={sort}
            onChange={(v) => setSort(v as string)}
            size="small"
          />
          <span style={{ color: "rgba(0,0,0,.65)", fontSize: 14 }}>
            {items.length} резюме
          </span>
        </div>
        {aiResults && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Tag color="purple">Результаты AI-поиска</Tag>
            <Button size="small" type="text" onClick={() => setAiResults(null)}>Сбросить</Button>
          </div>
        )}
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <Skeleton active />
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "rgba(0,0,0,.45)" }}>
            {debouncedSearch || selectedSources.length || selectedTags.length
              ? "Ничего не найдено. Попробуйте изменить запрос или фильтры."
              : "Начните искать — введите запрос выше."}
          </div>
        ) : (
          <Table<Candidate>
            columns={buildColumns()}
            dataSource={items}
            rowKey="candidateId"
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: (keys) => setSelectedIds(keys as string[]),
              getCheckboxProps: () => ({ onClick: (e) => e.stopPropagation() }),
            }}
            onRow={(record) => ({
              onClick: () => router.push(`/candidate/${record.candidateId}`),
              onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/candidate/${record.candidateId}`); } },
              style: { cursor: "pointer" },
              tabIndex: 0,
            })}
            pagination={{
              current: page,
              pageSize,
              total: data?.total ?? items.length,
              showSizeChanger: true,
              showTotal: (t) => `${t} резюме`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
            size="middle"
          />
        )}
      </div>

      <Drawer
        title="Фильтры"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        width={320}
        extra={
          <Button
            onClick={() => {
              setSelectedSources([]);
              setSelectedTags([]);
            }}
          >
            Сбросить
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h4 style={{ marginBottom: 12 }}>Источники</h4>
            <Checkbox.Group
              value={selectedSources}
              onChange={(vals) => setSelectedSources(vals as string[])}
            >
              <Space direction="vertical">
                {sourceValues.map((src) => (
                  <Checkbox key={src.code} value={src.code}>{src.name}</Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>
          <div>
            <h4 style={{ marginBottom: 12 }}>Метки</h4>
            <Checkbox.Group
              value={selectedTags}
              onChange={(vals) => setSelectedTags(vals as string[])}
            >
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

      <Drawer
        title="Сохранённые поиски"
        open={savedSearchOpen}
        onClose={() => setSavedSearchOpen(false)}
        width={360}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {((savedSearches as { items?: Array<{ id: string; name: string; query: string; createdAt: string }> })?.items ?? []).length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(0,0,0,.45)", padding: 24 }}>
              Нет сохранённых поисков
            </div>
          ) : (
            (savedSearches as { items?: Array<{ id: string; name: string; query: string; createdAt: string }> })?.items?.map((ss) => (
              <div key={ss.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,.03)" }}>
                <div
                  style={{ cursor: "pointer", flex: 1 }}
                  onClick={() => { setSearch(ss.query); setSavedSearchOpen(false); }}
                >
                  <div style={{ fontWeight: 600 }}>{ss.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>{ss.query}</div>
                </div>
                <Button type="text" size="small" danger onClick={() => deleteSearchMut.mutate(ss.id)}>
                  Удалить
                </Button>
              </div>
            ))
          )}
          {debouncedSearch && (
            <Button
              type="primary"
              block
              onClick={async () => {
                try {
                  await appApi.createSavedSearch({ name: debouncedSearch, query: debouncedSearch });
                  message.success("Поиск сохранён");
                  qc.invalidateQueries({ queryKey: qk.search.saved() });
                } catch { message.error("Не удалось сохранить"); }
              }}
            >
              Сохранить текущий поиск
            </Button>
          )}
        </div>
      </Drawer>
    </div>
  );
}
