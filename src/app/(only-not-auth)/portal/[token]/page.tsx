"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Tag, Skeleton, Avatar, Empty, Button, Descriptions, Timeline, Popconfirm, message } from "antd";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./portal.module.css";

const STATUS_COLORS: Record<string, string> = {
  active: "green", rejected: "red", hired: "blue", paused: "orange", new: "default",
};

export default function CandidatePortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const qc = useQueryClient();
  usePageTitle("Мой кабинет · Собесо");

  const withdrawMut = useMutation({
    mutationFn: ({ candidacyId }: { candidacyId: string }) => appApi.withdrawApplication(token, candidacyId),
    onSuccess: () => {
      message.success("Заявка отозвана");
      qc.invalidateQueries({ queryKey: ["candidate-portal", token] });
    },
    onError: () => message.error("Не удалось отозвать"),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["candidate-portal", token],
    queryFn: () => appApi.getCandidatePortal(token),
  });

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

  const initials = data.candidate.fullName?.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className={s.page}>
      <div className={s.header}>
        <Avatar size={64} style={{ background: "#6B53D5" }}>{initials}</Avatar>
        <div>
          <h1>{data.candidate.fullName}</h1>
          <p style={{ color: "rgba(0,0,0,.45)" }}>{data.candidate.email}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Button href={`/portal/${token}/messages`}>
          Сообщения {data.unreadMessages > 0 && `(${data.unreadMessages})`}
        </Button>
        <Button href={`/portal/${token}/documents`}>Документы</Button>
      </div>

      {data.activeOffer && (
        <Card style={{ marginBottom: 16, borderColor: "#6B53D5", borderWidth: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0 }}>У вас есть оффер!</h3>
              <p style={{ color: "rgba(0,0,0,.45)", margin: "4px 0 0" }}>
                {data.activeOffer.vacancyTitle} · {data.activeOffer.salaryFrom ?? "—"}–{data.activeOffer.salaryTo ?? "—"} {data.activeOffer.currency ?? "₽"}
              </p>
            </div>
            <Button type="primary" size="large" href={`/offer/${token}`}>Посмотреть оффер</Button>
          </div>
        </Card>
      )}

      {data.upcomingInterviews.length > 0 && (
        <Card title="Предстоящие интервью" style={{ marginBottom: 16 }}>
          {data.upcomingInterviews.map((iv) => (
            <div key={iv.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{iv.vacancyTitle}</strong> · {iv.type}
                  <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginTop: 4 }}>
                    {new Date(iv.scheduledAt).toLocaleString("ru-RU")} · {iv.durationMin} мин
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
                    {iv.location && `📍 ${iv.location}`}
                    {iv.meetingLink && <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"> Ссылка на встречу</a>}
                  </div>
                </div>
                <Button href={`/interview/${token}`}>Детали</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card title="Мои заявки">
        {data.applications.length === 0 ? (
          <Empty description="Нет заявок" />
        ) : (
          data.applications.map((app) => (
            <div key={app.candidacyId} style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{app.vacancyTitle}</strong>
                  <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginTop: 4 }}>
                    {app.companyName} · подано {new Date(app.appliedAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {app.stageName && <Tag>{app.stageName}</Tag>}
                  <Tag color={STATUS_COLORS[app.status] || "default"}>{app.status}</Tag>
                  {app.status === "active" && (
                    <Popconfirm
                      title="Отозвать заявку?"
                      onConfirm={() => withdrawMut.mutate({ candidacyId: app.candidacyId })}
                    >
                      <Button size="small" type="link" danger>Отозвать</Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
