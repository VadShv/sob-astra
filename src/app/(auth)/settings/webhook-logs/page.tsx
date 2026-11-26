"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Skeleton, Tooltip, Modal, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

const { Text } = Typography;

interface WebhookLog {
  id: string;
  hookId: string;
  hookUrl: string;
  event: string;
  status: number;
  requestBody?: string;
  responseBody?: string;
  durationMs: number;
  createdAt: string;
}

export default function WebhookLogsPage() {
  usePageTitle("Логи вебхуков · Настройки");
  const [page, setPage] = useState(1);
  const [detailLog, setDetailLog] = useState<WebhookLog | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.webhookLogs.list({ page: String(page), pageSize: "50" }),
    queryFn: () => appApi.getWebhookLogs({ page: String(page), pageSize: "50" }),
  });

  const columns: ColumnsType<WebhookLog> = [
    {
      title: "Время",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("ru-RU"),
    },
    { title: "URL", dataIndex: "hookUrl", key: "hookUrl", ellipsis: true },
    { title: "Событие", dataIndex: "event", key: "event", width: 150, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: number) => (
        <Tag color={v >= 200 && v < 300 ? "green" : v >= 400 && v < 500 ? "orange" : "red"}>{v}</Tag>
      ),
    },
    {
      title: "Длительность",
      dataIndex: "durationMs",
      key: "durationMs",
      width: 120,
      render: (v: number) => `${v} мс`,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <a onClick={() => setDetailLog(r)}>Детали</a>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Логи вебхуков">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table<WebhookLog>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          size="small"
          locale={{ emptyText: "Нет логов вебхуков" }}
          pagination={{
            current: page,
            pageSize: 50,
            total: data?.total ?? 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      )}

      <Modal
        title="Детали запроса"
        open={!!detailLog}
        onCancel={() => setDetailLog(null)}
        footer={null}
        width={640}
      >
        {detailLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Text strong>URL:</Text> {detailLog.hookUrl}
            </div>
            <div>
              <Text strong>Событие:</Text> {detailLog.event}
            </div>
            <div>
              <Text strong>Статус:</Text>{" "}
              <Tag color={detailLog.status >= 200 && detailLog.status < 300 ? "green" : "red"}>
                {detailLog.status}
              </Tag>
            </div>
            <div>
              <Text strong>Длительность:</Text> {detailLog.durationMs} мс
            </div>
            {detailLog.requestBody && (
              <div>
                <Text strong>Запрос:</Text>
                <pre style={{ background: "rgba(0,0,0,.04)", padding: 12, borderRadius: 8, overflow: "auto", fontSize: 12, marginTop: 4 }}>
                  {detailLog.requestBody}
                </pre>
              </div>
            )}
            {detailLog.responseBody && (
              <div>
                <Text strong>Ответ:</Text>
                <pre style={{ background: "rgba(0,0,0,.04)", padding: 12, borderRadius: 8, overflow: "auto", fontSize: 12, marginTop: 4 }}>
                  {detailLog.responseBody}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </SettingsLayout>
  );
}
