"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Tag, Button, message, Tooltip } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Vacancy, type VacancyStageCount } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
import s from "./kanban.module.css";

export default function KanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  usePageTitle("Канбан-доска");

  const { data: vacancy, isLoading, isError, refetch } = useQuery({
    queryKey: qk.vacancies.detail(id),
    queryFn: () => appApi.getVacancyById(id),
  });

  const { data: candidaciesData } = useQuery({
    queryKey: qk.vacancies.candidacies(id),
    queryFn: () => appApi.getVacancyCandidacies(id),
  });

  const moveMut = useMutation({
    mutationFn: ({ candidacyId, stageId }: { candidacyId: string; stageId: string }) =>
      appApi.moveCandidacyStage(candidacyId, stageId),
    onSuccess: () => {
      message.success("Кандидат перемещён");
      qc.invalidateQueries({ queryKey: qk.vacancies.candidacies(id) });
      qc.invalidateQueries({ queryKey: qk.vacancies.detail(id) });
    },
    onError: () => message.error("Не удалось переместить"),
  });

  if (isError) {
    return (
      <div className={s.page}>
        <PageHeader title="Канбан-доска" />
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
  const allCandidacies = candidaciesData?.items ?? [];

  const handleDragStart = (candidacyId: string) => {
    setDraggedId(candidacyId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDrop = (stageId: string) => {
    if (draggedId) {
      moveMut.mutate({ candidacyId: draggedId, stageId });
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStage(null);
  };

  return (
    <div className={s.page}>
      <PageHeader
        title={vacancy.title}
        sub={`Канбан-доска · ${vacancy.statusLabel}`}
        actions={
          <>
            <Button href={`/vacancy/${id}`}>Воронка</Button>
            <Button onClick={() => router.push("/search")}>Добавить кандидата</Button>
          </>
        }
      />

      <div className={s.board}>
        {stages.map((stage) => {
          const stageCandidacies = allCandidacies.filter(
            (c) => c.stageId === stage.stageId || c.stageType === stage.purpose,
          );
          const isDragOver = dragOverStage === stage.stageId;

          return (
            <div
              key={stage.stageId}
              className={`${s.column} ${isDragOver ? s.columnDragOver : ""}`}
              onDragOver={(e) => handleDragOver(e, stage.stageId)}
              onDrop={() => handleDrop(stage.stageId)}
              onDragLeave={() => setDragOverStage(null)}
            >
              <div className={s.columnHeader}>
                <span className={s.columnName}>{stage.name}</span>
                <span className={s.columnCount}>{stageCandidacies.length}</span>
              </div>

              <div className={s.columnBody}>
                {stageCandidacies.length === 0 ? (
                  <div className={s.emptyColumn}>
                    {isDragOver ? "Отпустите здесь" : "Нет кандидатов"}
                  </div>
                ) : (
                  stageCandidacies.map((c) => {
                    const initials = `${c.candidateFirstName?.[0] ?? ""}${c.candidateLastName?.[0] ?? ""}`.toUpperCase();
                    const statusColor = c.status === "active" ? "green" : c.status === "rejected" ? "red" : "blue";
                    return (
                      <div
                        key={c.candidacyId}
                        className={`${s.card} ${draggedId === c.candidacyId ? s.cardDragging : ""}`}
                        draggable
                        onDragStart={() => handleDragStart(c.candidacyId)}
                        onDragEnd={handleDragEnd}
                        onClick={() => router.push(`/candidate/${c.candidateId}`)}
                      >
                        <div className={s.cardHeader}>
                          <div className={s.avatar}>{initials}</div>
                          <div className={s.cardName}>{c.candidateFullName}</div>
                        </div>
                        {c.candidateEmail && (
                          <div className={s.cardEmail}>{c.candidateEmail}</div>
                        )}
                        <div className={s.cardFooter}>
                          <Tag color={statusColor}>{c.stageName}</Tag>
                          <Tooltip title={new Date(c.updatedAt).toLocaleString("ru-RU")}>
                            <span className={s.cardDate}>
                              {new Date(c.updatedAt).toLocaleDateString("ru-RU")}
                            </span>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
