"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Tag, Skeleton, Button, Avatar, Tooltip } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./activity.module.css";

const TYPE_COLORS: Record<string, string> = {
  create: "green",
  update: "blue",
  delete: "red",
  move: "purple",
  status_change: "orange",
  note: "default",
  message: "cyan",
  interview: "geekblue",
  offer: "volcano",
};

export default function ActivityPage() {
  usePageTitle("Лента активности");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.activityFeed.list({ page: String(page), pageSize: "30" }),
    queryFn: () => appApi.getActivityFeed({ page: String(page), pageSize: "30" }),
  });

  const items = data?.items ?? [];

  return (
    <div className={s.page}>
      <PageHeader title="Лента активности" sub="Последние действия в системе" />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : items.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: 32, color: "rgba(0,0,0,.45)" }}>
            Нет активности
          </div>
        </Card>
      ) : (
        <Card>
          <div className={s.timeline}>
            {items.map((item, i) => {
              const initials = item.userName
                ?.split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) ?? "?";
              return (
                <div key={item.id} className={s.timelineItem}>
                  {i < items.length - 1 && <div className={s.timelineLine} />}
                  <div className={s.timelineDot}>
                    <Avatar size={32} style={{ background: "#6B53D5" }}>{initials}</Avatar>
                  </div>
                  <div className={s.timelineContent}>
                    <div className={s.timelineHeader}>
                      <span style={{ fontWeight: 500 }}>{item.userName}</span>
                      <Tag color={TYPE_COLORS[item.type] || "default"}>{item.type}</Tag>
                      <Tooltip title={new Date(item.createdAt).toLocaleString("ru-RU")}>
                        <span className={s.timelineDate}>
                          {new Date(item.createdAt).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </Tooltip>
                    </div>
                    <div className={s.timelineDesc}>{item.description}</div>
                    {item.entityName && (
                      <div className={s.timelineEntity}>
                        <Tag>{item.entityType}</Tag>
                        {item.entityName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {data && page * 30 < data.total && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button onClick={() => setPage(page + 1)}>Загрузить ещё</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
