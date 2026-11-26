"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Table, Tag, Skeleton, Descriptions, Progress } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";

export default function BillingPage() {
  usePageTitle("Биллинг · Настройки");

  const { data: sub, isLoading: subLoading, isError, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => appApi.getSubscription(),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => appApi.getInvoices(),
  });

  return (
    <SettingsLayout activeItem="Биллинг">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : subLoading ? (
        <Skeleton active />
      ) : (
        <>
          <Card title="Подписка" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Тариф">{sub?.plan}</Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={sub?.status === "active" ? "green" : "red"}>{sub?.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Места">
                {sub?.usedSeats} / {sub?.seats}
              </Descriptions.Item>
              <Descriptions.Item label="Сумма">
                {sub?.amount?.toLocaleString("ru-RU")} {sub?.currency}
              </Descriptions.Item>
              <Descriptions.Item label="Период до" span={2}>
                {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("ru-RU") : "—"}
              </Descriptions.Item>
            </Descriptions>
            <Progress percent={sub ? (sub.usedSeats / sub.seats) * 100 : 0} strokeColor="#6B53D5" style={{ marginTop: 16 }} />
          </Card>

          <Card title="Счета">
            <Table
              dataSource={invoices?.items ?? []}
              rowKey="id"
              size="small"
              locale={{ emptyText: "Нет счетов" }}
              columns={[
                { title: "№", dataIndex: "number", key: "number" },
                { title: "Сумма", key: "amount", render: (_, r) => `${r.amount.toLocaleString("ru-RU")} ${r.currency}` },
                { title: "Статус", dataIndex: "status", key: "status", render: (v: string) => <Tag color={v === "paid" ? "green" : "orange"}>{v}</Tag> },
                { title: "Дата", dataIndex: "createdAt", key: "createdAt", render: (v: string) => new Date(v).toLocaleDateString("ru-RU") },
                { title: "", key: "pdf", render: (_, r) => r.pdfUrl ? <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer">PDF</a> : "—" },
              ]}
            />
          </Card>
        </>
      )}
    </SettingsLayout>
  );
}
