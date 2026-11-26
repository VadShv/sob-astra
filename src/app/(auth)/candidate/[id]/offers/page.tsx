"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Tag, Table, Button, Descriptions, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi, type Offer } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "default", sent: "blue", accepted: "green", declined: "red", withdrawn: "orange", expired: "red",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик", sent: "Отправлен", accepted: "Принят", declined: "Отклонён", withdrawn: "Отозван", expired: "Истёк",
};

export default function CandidateOffersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  usePageTitle("Офферы · Кандидат");
  const [detail, setDetail] = useState<Offer | null>(null);

  const { data: candidate } = useQuery({
    queryKey: qk.candidates.detail(id),
    queryFn: () => appApi.getCandidateById(id),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.offers.list(id),
    queryFn: () => appApi.getCandidateOffers(id),
  });

  const columns: ColumnsType<Offer> = [
    { title: "Вакансия", dataIndex: "vacancyTitle", key: "vacancyTitle" },
    {
      title: "Зарплата",
      key: "salary",
      render: (_, r) => r.salaryFrom || r.salaryTo ? `${r.salaryFrom ?? "—"}–${r.salaryTo ?? "—"} ${r.currency ?? "₽"}` : "—",
    },
    {
      title: "Дата старта",
      dataIndex: "startDate",
      key: "startDate",
      render: (v?: string) => v ? new Date(v).toLocaleDateString("ru-RU") : "—",
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={STATUS_COLORS[v] || "default"}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: "Отправлен",
      dataIndex: "sentAt",
      key: "sentAt",
      render: (v?: string) => v ? new Date(v).toLocaleDateString("ru-RU") : "—",
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => <a onClick={() => setDetail(r)}>Детали</a>,
    },
  ];

  return (
    <div>
      <PageHeader
        title={candidate?.fullName ?? "Офферы"}
        sub="История офферов по всем вакансиям"
        actions={<Button href={`/candidate/${id}`}>← Профиль</Button>}
      />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table<Offer>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          locale={{ emptyText: "Нет офферов" }}
          pagination={false}
        />
      )}

      <Modal title="Оффер" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={600}>
        {detail && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Вакансия" span={2}>{detail.vacancyTitle}</Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={STATUS_COLORS[detail.status] || "default"}>{STATUS_LABELS[detail.status] || detail.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Зарплата">
              {detail.salaryFrom || detail.salaryTo ? `${detail.salaryFrom ?? "—"}–${detail.salaryTo ?? "—"} ${detail.currency ?? "₽"}` : "—"}
            </Descriptions.Item>
            {detail.conditions && <Descriptions.Item label="Условия" span={2}>{detail.conditions}</Descriptions.Item>}
            {detail.benefits && <Descriptions.Item label="Бенефиты" span={2}>{detail.benefits}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
