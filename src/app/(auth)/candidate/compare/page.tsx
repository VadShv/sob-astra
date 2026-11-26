"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Card, Tag, Select, Empty, Descriptions, Avatar } from "antd";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./compare.module.css";

export default function ComparePage() {
  usePageTitle("Сравнение кандидатов");
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (ids) {
      setSelectedIds(ids.split(",").filter(Boolean).slice(0, 4));
    }
  }, [searchParams]);

  const { data: candidatesData } = useQuery({
    queryKey: qk.candidates.list(),
    queryFn: () => appApi.getCandidates({ page: "1", pageSize: "100" }),
  });

  const { data: compareData, isLoading, isError, refetch } = useQuery({
    queryKey: qk.compare.candidates(selectedIds),
    queryFn: () => appApi.compareCandidates(selectedIds),
    enabled: selectedIds.length >= 2,
  });

  const candidates = candidatesData?.items ?? [];
  const compareItems = compareData?.candidates ?? [];

  const fields = [
    { key: "email", label: "Email" },
    { key: "phone", label: "Телефон" },
    { key: "position", label: "Должность" },
    { key: "company", label: "Компания" },
    { key: "salary", label: "Зарплата", render: (v?: number) => v ? `${v.toLocaleString("ru-RU")} ₽` : "—" },
    { key: "experience", label: "Опыт" },
    { key: "education", label: "Образование" },
    { key: "rating", label: "Рейтинг", render: (v?: number) => v ? `${v}/5` : "—" },
    { key: "lastActivity", label: "Активность", render: (v?: string) => v ? new Date(v).toLocaleDateString("ru-RU") : "—" },
  ] as const;

  return (
    <div className={s.page}>
      <PageHeader title="Сравнение кандидатов" sub="Выберите 2–4 кандидатов для сравнения" />

      <Card style={{ marginBottom: 16 }}>
        <Select
          mode="multiple"
          placeholder="Выберите кандидатов для сравнения"
          value={selectedIds}
          onChange={(v) => setSelectedIds(v.slice(0, 4))}
          style={{ width: "100%" }}
          options={candidates.map((c) => ({
            value: c.candidateId,
            label: c.fullName,
          }))}
          maxTagCount={4}
        />
      </Card>

      {selectedIds.length < 2 ? (
        <Card>
          <Empty description="Выберите минимум 2 кандидата для сравнения" />
        </Card>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <div className={s.grid}>
          {compareItems.map((c) => {
            const initials = c.fullName?.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) ?? "?";
            return (
              <Card key={c.candidateId} className={s.card}>
                <div className={s.cardHeader}>
                  <Avatar size={48} style={{ background: "#6B53D5" }}>{initials}</Avatar>
                  <div>
                    <div className={s.cardName}>{c.fullName}</div>
                    <div className={s.cardSub}>{c.position || "—"}</div>
                  </div>
                </div>

                {c.skills && c.skills.length > 0 && (
                  <div className={s.skills}>
                    {c.skills.slice(0, 8).map((sk) => <Tag key={sk}>{sk}</Tag>)}
                  </div>
                )}

                {c.tags && c.tags.length > 0 && (
                  <div className={s.tags}>
                    {c.tags.map((t) => <Tag key={t} color="purple">{t}</Tag>)}
                  </div>
                )}

                <Descriptions column={1} size="small" bordered>
                  {fields.map((f) => (
                    <Descriptions.Item label={f.label} key={f.key}>
                      {"render" in f && f.render
                        ? f.render((c as Record<string, unknown>)[f.key] as never)
                        : ((c as Record<string, unknown>)[f.key] as string) || "—"}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
