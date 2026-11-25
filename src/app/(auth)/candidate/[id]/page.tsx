"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Tag, Button } from "antd";
import { PageHeader } from "@/components/PageHeader";
import s from "./candidate.module.css";

export default function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => {
      const resp = await fetch(`/proxy/api/candidate/${id}`, { credentials: "include" });
      if (!resp.ok) return null;
      return resp.json();
    },
  });

  if (isLoading) {
    return (
      <div className={s.page}>
        <PageHeader title="Загрузка…" />
        <Skeleton active />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className={s.page}>
        <PageHeader title="Кандидат не найден" />
        <div className={s.panel}>
          <div className={s.empty}>Кандидат не найден или у вас нет доступа.</div>
        </div>
      </div>
    );
  }

  const fullName = candidate.fullName ?? `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim();
  const initials = fullName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={s.page}>
      <PageHeader
        title={fullName}
        actions={<Button type="primary">Редактировать</Button>}
      />

      <div className={s.profile}>
        <div className={s.avatar}>{initials}</div>
        <div className={s.profileInfo}>
          <div className={s.profileName}>{fullName}</div>
          <div className={s.profileMeta}>
            {candidate.email && (
              <span className={s.profileMetaItem}>✉ {candidate.email}</span>
            )}
            {candidate.phone && (
              <span className={s.profileMetaItem}>☎ {candidate.phone}</span>
            )}
            {candidate.passport?.title && (
              <span className={s.profileMetaItem}>Должность: {candidate.passport.title}</span>
            )}
            {candidate.passport?.salary && (
              <span className={s.profileMetaItem}>Зарплата: {candidate.passport.salary}</span>
            )}
          </div>
        </div>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Вакансии</h3>
        <div className={s.empty}>
          Кандидат пока не привязан к вакансиям
        </div>
      </div>
    </div>
  );
}
