"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Card, Tag, Button, Checkbox, Space, message, Popconfirm } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { useState } from "react";

const CHANNELS = [
  { value: "hh", label: "HeadHunter", description: "Публикация на hh.ru" },
  { value: "superjob", label: "SuperJob", description: "Публикация на superjob.ru" },
  { value: "rabota", label: "Работа.ру", description: "Публикация на rabota.ru" },
  { value: "zarplata", label: "Зарплата.ру", description: "Публикация на zarplata.ru" },
];

export default function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  usePageTitle("Публикация · Вакансия");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: vacancy } = useQuery({
    queryKey: qk.vacancies.detail(id),
    queryFn: () => appApi.getVacancyById(id),
  });

  const { data: publications, isLoading, isError, refetch } = useQuery({
    queryKey: ["vacancy-publications", id],
    queryFn: () => appApi.getPublicationStatus(id),
  });

  const publishMut = useMutation({
    mutationFn: (channels: string[]) => appApi.publishVacancy(id, channels),
    onSuccess: () => {
      message.success("Вакансия опубликована");
      qc.invalidateQueries({ queryKey: ["vacancy-publications", id] });
      setSelected([]);
    },
    onError: () => message.error("Не удалось опубликовать"),
  });

  const unpublishMut = useMutation({
    mutationFn: (channel: string) => appApi.unpublishVacancy(id, channel),
    onSuccess: () => {
      message.success("Публикация снята");
      qc.invalidateQueries({ queryKey: ["vacancy-publications", id] });
    },
    onError: () => message.error("Не удалось снять публикацию"),
  });

  const pubs = publications?.items ?? [];

  return (
    <div>
      <PageHeader
        title={vacancy?.title ?? "Публикация"}
        sub="Публикация на работные сайты"
        actions={<Button href={`/vacancy/${id}`}>← Вакансия</Button>}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <Card title="Текущие публикации" style={{ marginBottom: 16 }}>
            {pubs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>
                Вакансия ещё не опубликована
              </div>
            ) : (
              pubs.map((p) => (
                <div key={p.channel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <Space>
                    <Tag color={p.published ? "green" : "red"}>{p.channelName}</Tag>
                    {p.externalUrl && <a href={p.externalUrl} target="_blank" rel="noopener noreferrer">Открыть →</a>}
                    {p.error && <span style={{ color: "red", fontSize: 12 }}>{p.error}</span>}
                  </Space>
                  <Space>
                    {p.publishedAt && <span style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>{new Date(p.publishedAt).toLocaleDateString("ru-RU")}</span>}
                    {p.published && (
                      <Popconfirm title="Снять публикацию?" onConfirm={() => unpublishMut.mutate(p.channel)}>
                        <Button size="small" danger>Снять</Button>
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              ))
            )}
          </Card>

          <Card title="Опубликовать на">
            <Checkbox.Group
              value={selected}
              onChange={(vals) => setSelected(vals as string[])}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {CHANNELS.map((ch) => {
                const alreadyPublished = pubs.find((p) => p.channel === ch.value && p.published);
                return (
                  <Checkbox key={ch.value} value={ch.value} disabled={!!alreadyPublished}>
                    <Space>
                      <strong>{ch.label}</strong>
                      <span style={{ color: "rgba(0,0,0,.45)" }}>{ch.description}</span>
                      {alreadyPublished && <Tag color="green">опубликовано</Tag>}
                    </Space>
                  </Checkbox>
                );
              })}
            </Checkbox.Group>
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                disabled={selected.length === 0}
                loading={publishMut.isPending}
                onClick={() => publishMut.mutate(selected)}
              >
                Опубликовать
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
