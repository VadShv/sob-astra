"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Button, Tag, message } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./notifications.module.css";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  usePageTitle("Уведомления");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...qk.notifications.list(), page, pageSize],
    queryFn: () => appApi.getNotifications({ page: String(page), pageSize: String(pageSize) }),
  });

  const readMut = useMutation({
    mutationFn: (id: string) => appApi.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.list() });
      qc.invalidateQueries({ queryKey: qk.notifications.unread() });
    },
    onError: () => message.error("Не удалось отметить"),
  });

  const items = (data as { items?: NotificationItem[] })?.items ?? [];

  return (
    <div className={s.page}>
      <PageHeader title="Уведомления" sub="Все события системы" />
      <div className={s.panel}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <Skeleton active />
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--ats-text-3, rgba(0,0,0,.45))" }}>
            Нет уведомлений
          </div>
        ) : (
          <>
            {items.map((n) => (
              <div key={n.id} className={`${s.item} ${!n.read ? s.itemUnread : ""}`}>
                <div className={`${s.dot} ${n.read ? s.dotRead : ""}`} />
                <div className={s.itemBody}>
                  <div className={s.itemTitle}>
                    {n.title}
                    {n.type && <Tag style={{ marginLeft: 8 }}>{n.type}</Tag>}
                  </div>
                  <div className={s.itemText}>{n.body}</div>
                  <div className={s.itemTime}>
                    {new Date(n.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                {!n.read && (
                  <Button
                    size="small"
                    type="text"
                    loading={readMut.isPending}
                    onClick={() => readMut.mutate(n.id)}
                  >
                    Прочитать
                  </Button>
                )}
              </div>
            ))}
            {items.length >= pageSize && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <Button onClick={() => setPage((p) => p + 1)}>Загрузить ещё</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
