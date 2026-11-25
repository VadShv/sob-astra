"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button, Segmented, Skeleton, Table, Tag, Input, message, Drawer, Checkbox, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Conversation } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
import s from "./messages.module.css";

export default function MessagesPage() {
  const qc = useQueryClient();
  usePageTitle("Сообщения");
  const [tab, setTab] = useState<"all" | "vacancy">("all");
  const [subTab, setSubTab] = useState<"active" | "archive">("active");
  const [onlyMine, setOnlyMine] = useState(false);
  const [showCover, setShowCover] = useState(false);
  const [selectedCandidacy, setSelectedCandidacy] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.conversations.awaiting(subTab, onlyMine, channelFilter, page, pageSize),
    queryFn: ({ signal }) =>
      appApi.getConversationsAwaiting({
        sort: "longest",
        page: String(page),
        pageSize: String(pageSize),
        ...(subTab === "archive" ? { status: "archive" } : {}),
        ...(onlyMine ? { onlyMine: "true" } : {}),
        ...(channelFilter.length ? { channels: channelFilter.join(",") } : {}),
      }, signal),
    refetchInterval: 10000,
    placeholderData: keepPreviousData,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: qk.conversations.messages(selectedCandidacy!),
    queryFn: () => appApi.getConversationMessages(selectedCandidacy!),
    enabled: !!selectedCandidacy,
    refetchInterval: 5000,
  });

  const sendMut = useMutation({
    mutationFn: ({ candidacyId, body }: { candidacyId: string; body: string }) =>
      appApi.sendMessage(candidacyId, body),
    onSuccess: () => {
      message.success("Отправлено");
      setReplyText("");
      qc.invalidateQueries({ queryKey: qk.conversations.messages(selectedCandidacy!) });
      qc.invalidateQueries({ queryKey: qk.conversations.all() });
    },
    onError: () => message.error("Не удалось отправить"),
  });

  const resp = data as
    | { items?: Conversation[]; total?: number; counts?: { active: number; archive: number; calledHr: number } }
    | undefined;
  const items = resp?.items ?? [];
  const counts = resp?.counts ?? { active: 0, archive: 0, calledHr: 0 };
  const messages = (messagesData as { items?: Array<{ id: string; body: string; direction: "in" | "out"; createdAt: string; channel: string }> })?.items ?? [];

  const columns: ColumnsType<Conversation> = [
    { title: "Кандидат", dataIndex: "candidateFullName", key: "candidateFullName" },
    ...(tab === "vacancy" ? [{ title: "Вакансия", dataIndex: "vacancyTitle", key: "vacancyTitle", render: (v: string) => v || "—" }] : []),
    {
      title: "Канал",
      dataIndex: "channel",
      key: "channel",
      render: (ch: string) => (ch ? <Tag>{ch}</Tag> : "—"),
    },
    { title: "Последнее сообщение", dataIndex: "lastMessageBody", key: "lastMessageBody", ellipsis: true, render: (v: string) => v || "—" },
    {
      title: "Ждёт",
      dataIndex: "lastMessageAt",
      key: "lastMessageAt",
      render: (v: string) => v ? new Date(v).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—",
    },
    {
      title: "Статус",
      dataIndex: "awaiting",
      key: "awaiting",
      render: (a: boolean) => (a ? <Tag color="orange">Ждёт ответа</Tag> : <Tag color="green">Ответ дан</Tag>),
    },
  ];

  const selectedConv = items.find((c) => c.candidacyId === selectedCandidacy);

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
          onChange={(v) => setSubTab(v as "active" | "archive")}
          size="small"
        />
        <Button size="small" onClick={() => setFilterOpen(true)}>Фильтры</Button>
        <Button
          size="small"
          type={onlyMine ? "primary" : "text"}
          onClick={() => setOnlyMine(!onlyMine)}
        >
          Только мои вакансии
        </Button>
        <Button
          size="small"
          type={showCover ? "primary" : "text"}
          onClick={() => setShowCover(!showCover)}
        >
          Показывать сопроводительные
        </Button>
      </div>

      <div className={s.panel} style={{ display: "flex", gap: 0 }}>
        <div style={{ flex: "1 1 55%", borderRight: "1px solid rgba(0,0,0,.06)" }}>
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
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
              onRow={(record) => ({
                onClick: () => setSelectedCandidacy(record.candidacyId),
                onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedCandidacy(record.candidacyId); } },
                style: {
                  cursor: "pointer",
                  background: record.candidacyId === selectedCandidacy ? "rgba(107,83,213,.06)" : undefined,
                },
                tabIndex: 0,
              })}
              pagination={{
                current: page,
                pageSize,
                total: (resp as { total?: number })?.total ?? items.length,
                showSizeChanger: true,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              }}
              size="middle"
            />
          )}
        </div>
        <div style={{ flex: "1 1 45%", padding: 16, display: "flex", flexDirection: "column" }}>
          {!selectedCandidacy ? (
            <div style={{ textAlign: "center", color: "rgba(0,0,0,.45)", padding: 48 }}>
              Выберите кандидата слева, чтобы прочитать переписку
            </div>
          ) : messagesLoading ? (
            <Skeleton active />
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                {selectedConv?.candidateFullName ?? "Переписка"}
              </div>
              <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {showCover && messages.length > 0 && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(107,83,213,.08)",
                    border: "1px solid rgba(107,83,213,.2)",
                    marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6B53D5", marginBottom: 4 }}>
                      Сопроводительное письмо
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(0,0,0,.65)", whiteSpace: "pre-wrap" }}>
                      {messages.find((m) => m.direction === "in")?.body ?? "—"}
                    </div>
                  </div>
                )}
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "rgba(0,0,0,.45)", padding: 24 }}>
                    Нет сообщений
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: msg.direction === "out" ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background: msg.direction === "out" ? "#6B53D5" : "#f0f0f0",
                        color: msg.direction === "out" ? "#fff" : "inherit",
                      }}
                    >
                      <div style={{ fontSize: 13 }}>{msg.body}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                        {new Date(msg.createdAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,.06)" }}>
                <Input.TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Написать ответ…"
                  rows={2}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  loading={sendMut.isPending}
                  disabled={!replyText.trim()}
                  onClick={() => sendMut.mutate({ candidacyId: selectedCandidacy, body: replyText })}
                >
                  Отправить
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        title="Фильтры"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        width={300}
        extra={<Button onClick={() => setChannelFilter([])}>Сбросить</Button>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h4 style={{ marginBottom: 12 }}>Канал</h4>
            <Checkbox.Group
              value={channelFilter}
              onChange={(vals) => setChannelFilter(vals as string[])}
            >
              <Space direction="vertical">
                <Checkbox value="email">Email</Checkbox>
                <Checkbox value="telegram">Telegram</Checkbox>
                <Checkbox value="whatsapp">WhatsApp</Checkbox>
                <Checkbox value="sms">SMS</Checkbox>
              </Space>
            </Checkbox.Group>
          </div>
          <Button type="primary" block onClick={() => { setFilterOpen(false); setPage(1); }}>
            Применить
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
