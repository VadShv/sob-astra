"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Tag, Button, Tooltip, message } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Vacancy, type VacancyStageCount } from "@/lib/api";
import s from "./vacancy.module.css";

export default function VacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
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
  const allCandidacies = interviews?.candidacies ?? [];

  const allStages = [
    { stageId: "all", name: "Все", count: totalCount, purpose: "all", enabled: true },
    ...stages,
    { stageId: "rejected", name: "Отказ", count: 0, purpose: "rejected", enabled: true },
  ];

  const recruiterNames = vacancy.recruiters?.map((r) => r.name).join(", ") || vacancy.hrName || "—";

  return (
    <div className={s.page}>
      <PageHeader
        title={vacancy.title}
        sub={`${vacancy.statusLabel} · ${recruiterNames}`}
        actions={
          <>
            <Button onClick={() => message.info("Редактирование — в разработке")}>
              Редактировать
            </Button>
            <Button
              type="primary"
              onClick={() => message.info("Добавление кандидата — в разработке")}
            >
              Добавить кандидата
            </Button>
          </>
        }
      />

      {(vacancy.plannedHires > 0 || vacancy.hiredCount > 0) && (
        <div style={{ display: "flex", gap: 16, padding: "12px 24px", borderRadius: 18, background: "#fff" }}>
          <div>
            <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>План найма: </span>
            <strong>{vacancy.plannedHires}</strong>
          </div>
          <div>
            <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>Нанято: </span>
            <strong>{vacancy.hiredCount}</strong>
          </div>
          {vacancy.orgUnit && (
            <div>
              <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>Подразделение: </span>
              <strong>{vacancy.orgUnit.name}</strong>
            </div>
          )}
        </div>
      )}

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
        {allCandidacies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "rgba(0,0,0,.45)" }}>
            {activeStage === "all"
              ? "Нет кандидатов на этой вакансии"
              : "Нет кандидатов на этом этапе"}
          </div>
        ) : (
          allCandidacies.map((c) => {
            const initials = `${c.candidateFirstName?.[0] ?? ""}${c.candidateLastName?.[0] ?? ""}`.toUpperCase();
            return (
              <div
                key={c.candidacyId}
                className={s.candidateRow}
                onClick={() => router.push(`/candidate/${c.candidacyId}`)}
                style={{ cursor: "pointer" }}
              >
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
