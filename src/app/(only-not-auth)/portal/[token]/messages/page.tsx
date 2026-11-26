"use client";

import { use, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Input, Button, Tag, Empty, message } from "antd";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./messages.module.css";

export default function CandidateMessagesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const qc = useQueryClient();
  usePageTitle("Сообщения · Собесо");
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["candidate-messages", token],
    queryFn: () => appApi.getCandidateMessages(token),
    refetchInterval: 15000,
  });

  const sendMut = useMutation({
    mutationFn: (body: string) => appApi.sendCandidateMessage(token, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-messages", token] });
      setText("");
    },
    onError: () => message.error("Не удалось отправить"),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages]);

  if (isError) {
    return (
      <div className={s.page}>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className={s.page}>
        <Skeleton active />
      </div>
    );
  }

  const messages = data.messages ?? [];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1>Сообщения</h1>
        <Button href={`/portal/${token}`}>← Назад</Button>
      </div>

      <div className={s.chat}>
        <div ref={scrollRef} className={s.messages}>
          {messages.length === 0 ? (
            <Empty description="Нет сообщений" style={{ marginTop: 48 }} />
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`${s.msg} ${msg.direction === "out" ? s.msgOut : s.msgIn}`}>
                <div className={s.bubble}>
                  <div className={s.text}>{msg.body}</div>
                  <div className={s.meta}>
                    <span>{new Date(msg.createdAt).toLocaleString("ru-RU")}</span>
                    <Tag>{msg.channel}</Tag>
                  </div>
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
            autoSize={{ minRows: 2, maxRows: 5 }}
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
