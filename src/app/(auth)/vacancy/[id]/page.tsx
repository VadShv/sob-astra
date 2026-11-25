"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Tag, Button } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Vacancy, type VacancyStageCount } from "@/lib/api";
import s from "./vacancy.module.css";

export default function VacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeStage, setActiveStage] = useState<string>("all");

  const { data: vacancy, isLoading } = useQuery({
    queryKey: ["vacancy", id],
    queryFn: () => appApi.getVacancyById(id),
  });

  const { data: interviews } = useQuery({
    queryKey: ["vacancy-interviews", id],
    queryFn: () => appApi.getVacancyInterviews(id, { hideRejected: "true" }),
  });

  if (isLoading || !vacancy) {
    return (
      <div className={s.page}>
        <PageHeader title="Загрузка…" />
        <Skeleton active />
      </div>
    );
  }

  const stages: VacancyStageCount[] = vacancy.stageCounts ?? [];
  const totalCount = stages.reduce((sum, st) => sum + st.count, 0);
  const candidacies = interviews?.candidacies ?? [];

  const allStages = [
    { stageId: "all", name: "Все", count: totalCount, purpose: "all", enabled: true },
    ...stages,
    { stageId: "rejected", name: "Отказ", count: 0, purpose: "rejected", enabled: true },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        title={vacancy.title}
        sub={`${vacancy.statusLabel} · ${vacancy.recruiters?.map((r) => r.name).join(", ") || vacancy.hrName || "—"}`}
        actions={
          <>
            <Button>Редактировать</Button>
            <Button type="primary">Добавить кандидата</Button>
          </>
        }
      />

      <div className={s.funnel}>
        {allStages.map((stage, i) => (
          <div key={stage.stageId} style={{ display: "flex", alignItems: "center" }}>
            <a
              className={`${s.stage} ${activeStage === stage.stageId ? s.stageActive : ""}`}
              onClick={() => setActiveStage(stage.stageId)}
            >
              <span className={s.stageCount}>{stage.count}</span>
              <span className={s.stageName}>{stage.name}</span>
            </a>
            {i < allStages.length - 1 && <span className={s.stageArrow}>→</span>}
          </div>
        ))}
      </div>

      <div className={s.panel}>
        {candidacies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "rgba(0,0,0,.45)" }}>
            Нет кандидатов на этом этапе
          </div>
        ) : (
          candidacies.map((c) => {
            const initials = `${c.candidateFirstName?.[0] ?? ""}${c.candidateLastName?.[0] ?? ""}`.toUpperCase();
            return (
              <div key={c.candidacyId} className={s.candidateRow}>
                <div className={s.avatar}>{initials}</div>
                <div className={s.candidateInfo}>
                  <div className={s.candidateName}>{c.candidateFullName}</div>
                  <div className={s.candidateMeta}>
                    {c.candidateEmail && <span>{c.candidateEmail}</span>}
                    {c.vacancy?.board?.integrationType && (
                      <span>через {c.vacancy.board.integrationType}</span>
                    )}
                  </div>
                </div>
                <div className={s.candidateStatus}>
                  <Tag color="blue">новый</Tag>
                  <span style={{ fontSize: 13, color: "rgba(0,0,0,.65)" }}>Идёт</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
