"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Skeleton } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";

export default function WebhookEventsPage() {
  usePageTitle("События вебхуков · Настройки");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["webhook-event-types"],
    queryFn: () => appApi.getWebhookEventTypes(),
  });

  return (
    <SettingsLayout activeItem="События вебхуков">
      <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Доступные события вебхуков</h3>
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          dataSource={data ?? []}
          rowKey="value"
          locale={{ emptyText: "Нет событий" }}
          columns={[
            { title: "Событие", dataIndex: "value", key: "value", render: (v: string) => <Tag>{v}</Tag> },
            { title: "Название", dataIndex: "label", key: "label" },
            { title: "Описание", dataIndex: "description", key: "description", render: (v?: string) => v || "—" },
          ]}
        />
      )}
    </SettingsLayout>
  );
}
