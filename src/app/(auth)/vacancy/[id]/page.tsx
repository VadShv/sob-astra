"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Tag, Button, Dropdown, message, Popconfirm } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Vacancy, type VacancyStageCount } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
import s from "./vacancy.module.css";

export default function VacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [activeStage, setActiveStage] = useState<string>("all");
  usePageTitle("Вакансия");

  const { data: vacancy, isLoading, isError, refetch } = useQuery({
    queryKey: qk.vacancies.detail(id),
    queryFn: () => appApi.getVacancyById(id),
  });

  const { data: candidaciesData } = useQuery({
    queryKey: qk.vacancies.candidacies(id),
    queryFn: () => appApi.getVacancyCandidacies(id),
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => appApi.updateVacancyStatus(id, status),
    onSuccess: () => {
      message.success("Статус обновлён");
      qc.invalidateQueries({ queryKey: qk.vacancies.detail(id) });
      qc.invalidateQueries({ queryKey: qk.vacancies.all() });
      qc.invalidateQueries({ queryKey: qk.vacancies.sidebar() });
      qc.invalidateQueries({ queryKey: qk.vacancies.facets() });
    },
    onError: () => message.error("Не удалось изменить статус"),
  });

  const duplicateMut = useMutation({
    mutationFn: () => appApi.duplicateVacancy(id),
    onSuccess: (data) => {
      message.success("Вакансия дублирована");
      router.push(`/vacancy/${data.id}`);
    },
    onError: () => message.error("Не удалось дублировать"),
  });

  const archiveMut = useMutation({
    mutationFn: () => appApi.archiveVacancy(id),
    onSuccess: () => {
      message.success("Вакансия архивирована");
      router.push("/home");
    },
    onError: () => message.error("Не удалось архивировать"),
  });

  const moveMut = useMutation({
    mutationFn: ({ candidacyId, stageId }: { candidacyId: string; stageId: string }) =>
      appApi.moveCandidacyStage(candidacyId, stageId),
    onSuccess: () => {
      message.success("Кандидат перемещён");
      qc.invalidateQueries({ queryKey: qk.vacancies.candidacies(id) });
    },
    onError: () => message.error("Не удалось переместить"),
  });

  if (isError) {
    return (
      <div className={s.page}>
        <PageHeader title="Вакансия" />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

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
  const allCandidacies = candidaciesData?.items ?? [];

  const filteredCandidacies = activeStage === "all"
    ? allCandidacies
    : allCandidacies.filter((c) => c.stageId === activeStage || c.stageType === activeStage);

  const allStages = [
    { stageId: "all", name: "Все", count: totalCount, purpose: "all", enabled: true },
    ...stages,
  ];

  const recruiterNames = vacancy.recruiters?.map((r) => r.name).join(", ") || vacancy.hrName || "—";
  const isPaused = vacancy.status === "paused";
  const isActive = vacancy.status === "active";

  return (
    <div className={s.page}>
      <PageHeader
        title={vacancy.title}
        sub={`${vacancy.statusLabel} · ${recruiterNames}`}
        actions={
          <>
            <Button href={`/vacancy/new?id=${id}`}>Редактировать</Button>
            <Button href={`/vacancy/${id}/kanban`}>Канбан</Button>
            <Button href={`/vacancy/${id}/interviews`}>Интервью</Button>
            <Button href={`/vacancy/${id}/offers`}>Офферы</Button>
            <Button href={`/vacancy/${id}/publish`}>Публикация</Button>
            <Button href={`/vacancy/${id}/analytics`}>Аналитика</Button>
            <Button onClick={() => router.push("/search")}>Добавить кандидата</Button>
            <Button loading={duplicateMut.isPending} onClick={() => duplicateMut.mutate()}>
              Дублировать
            </Button>
            <Popconfirm title="Архивировать вакансию?" onConfirm={() => archiveMut.mutate()}>
              <Button>Архив</Button>
            </Popconfirm>
            {isActive && (
              <Popconfirm title="Поставить на паузу?" onConfirm={() => statusMut.mutate("paused")}>
                <Button>Пауза</Button>
              </Popconfirm>
            )}
            {isPaused && (
              <Button type="primary" onClick={() => statusMut.mutate("active")}>
                Активировать
              </Button>
            )}
            <Popconfirm title="Закрыть вакансию?" onConfirm={() => statusMut.mutate("closed")}>
              <Button danger>Закрыть</Button>
            </Popconfirm>
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
        {filteredCandidacies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "rgba(0,0,0,.45)" }}>
            {activeStage === "all"
              ? "Нет кандидатов на этой вакансии"
              : "Нет кандидатов на этом этапе"}
          </div>
        ) : (
          filteredCandidacies.map((c) => {
            const initials = `${c.candidateFirstName?.[0] ?? ""}${c.candidateLastName?.[0] ?? ""}`.toUpperCase();
            const statusColor = c.status === "active" ? "green" : c.status === "rejected" ? "red" : "blue";
            return (
              <div
                key={c.candidacyId}
                className={s.candidateRow}
                style={{ cursor: "pointer" }}
              >
                <div className={s.avatar} onClick={() => router.push(`/candidate/${c.candidateId}`)}>
                  {initials}
                </div>
                <div className={s.candidateInfo} onClick={() => router.push(`/candidate/${c.candidateId}`)}>
                  <div className={s.candidateName}>{c.candidateFullName}</div>
                  <div className={s.candidateMeta}>
                    {c.candidateEmail && <span>{c.candidateEmail}</span>}
                    <span>обновлён {new Date(c.updatedAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                </div>
                <div className={s.candidateStatus}>
                  <Tag color={statusColor}>{c.stageName}</Tag>
                  <Dropdown
                    menu={{
                      items: stages.map((st) => ({
                        key: st.stageId,
                        label: st.name,
                        onClick: () => moveMut.mutate({ candidacyId: c.candidacyId, stageId: st.stageId }),
                      })),
                    }}
                    trigger={["click"]}
                  >
                    <Button size="small" type="text" onClick={(e) => e.stopPropagation()}>
                      Переместить ▾
                    </Button>
                  </Dropdown>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
