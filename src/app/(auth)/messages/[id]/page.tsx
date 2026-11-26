"use client";

import { use, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Input, Button, Tag, Upload, message, Avatar, Empty } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./chat.module.css";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  usePageTitle("Чат · Сообщения");
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => appApi.getConversationDetails(id),
    refetchInterval: 10000,
  });

  const sendMut = useMutation({
    mutationFn: (body: string) => appApi.sendMessage(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", id] });
      setText("");
    },
    onError: () => message.error("Не удалось отправить"),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages]);

  if (isError) {
    return (
      <div>
        <PageHeader title="Чат" />
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

  const messages = data.messages ?? [];
  const initials = data.candidateFullName?.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className={s.page}>
      <PageHeader
        title={data.candidateFullName}
        sub={`${data.vacancyTitle} · ${data.channel}`}
        actions={<Button href="/messages">← Назад</Button>}
      />

      <div className={s.chat}>
        <div ref={scrollRef} className={s.messages}>
          {messages.length === 0 ? (
            <Empty description="Нет сообщений" style={{ marginTop: 48 }} />
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`${s.msg} ${msg.direction === "out" ? s.msgOut : s.msgIn}`}>
                <div className={s.msgBubble}>
                  <div className={s.msgText}>{msg.body}</div>
                  <div className={s.msgMeta}>
                    <span>{new Date(msg.createdAt).toLocaleString("ru-RU")}</span>
                    <Tag>{msg.channel}</Tag>
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={s.attachments}>
                      {msg.attachments.map((a) => (
                        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={s.input}>
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать сообщение…"
            autoSize={{ minRows: 2, maxRows: 6 }}
            onPressEnter={(e) => {
              if (!e.shiftKey && text.trim()) {
                e.preventDefault();
                sendMut.mutate(text.trim());
              }
            }}
          />
          <Button
            type="primary"
            disabled={!text.trim()}
            loading={sendMut.isPending}
            onClick={() => sendMut.mutate(text.trim())}
          >
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
