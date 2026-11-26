"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Skeleton, Table, Tag, Button, Modal, Form, Input, Select,
  Space, message, Popconfirm, Segmented, Tooltip, Descriptions,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi, type Offer } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./offers.module.css";

const STATUS_COLORS: Record<string, string> = {
  draft: "default",
  sent: "blue",
  accepted: "green",
  declined: "red",
  withdrawn: "orange",
  expired: "red",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлен",
  accepted: "Принят",
  declined: "Отклонён",
  withdrawn: "Отозван",
  expired: "Истёк",
};

export default function OffersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  usePageTitle("Офферы · Вакансия");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOffer, setDetailOffer] = useState<Offer | null>(null);
  const [form] = Form.useForm();

  const { data: vacancy } = useQuery({
    queryKey: qk.vacancies.detail(id),
    queryFn: () => appApi.getVacancyById(id),
  });

  const { data: offersData, isLoading, isError, refetch } = useQuery({
    queryKey: qk.offers.list(id, { status: statusFilter }),
    queryFn: () => appApi.getOffers(id, {
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
  });

  const { data: candidaciesData } = useQuery({
    queryKey: qk.vacancies.candidacies(id),
    queryFn: () => appApi.getVacancyCandidacies(id),
  });

  const createMut = useMutation({
    mutationFn: (payload: Parameters<typeof appApi.createOffer>[0]) => appApi.createOffer(payload),
    onSuccess: () => {
      message.success("Оффер создан");
      qc.invalidateQueries({ queryKey: qk.offers.list(id) });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать оффер"),
  });

  const sendMut = useMutation({
    mutationFn: (offerId: string) => appApi.sendOffer(offerId),
    onSuccess: () => {
      message.success("Оффер отправлен");
      qc.invalidateQueries({ queryKey: qk.offers.list(id) });
    },
    onError: () => message.error("Не удалось отправить"),
  });

  const acceptMut = useMutation({
    mutationFn: (offerId: string) => appApi.acceptOffer(offerId),
    onSuccess: () => {
      message.success("Оффер принят");
      qc.invalidateQueries({ queryKey: qk.offers.list(id) });
    },
    onError: () => message.error("Не удалось принять"),
  });

  const declineMut = useMutation({
    mutationFn: (offerId: string) => appApi.declineOffer(offerId),
    onSuccess: () => {
      message.success("Оффер отклонён");
      qc.invalidateQueries({ queryKey: qk.offers.list(id) });
    },
    onError: () => message.error("Не удалось отклонить"),
  });

  const withdrawMut = useMutation({
    mutationFn: (offerId: string) => appApi.withdrawOffer(offerId),
    onSuccess: () => {
      message.success("Оффер отозван");
      qc.invalidateQueries({ queryKey: qk.offers.list(id) });
    },
    onError: () => message.error("Не удалось отозвать"),
  });

  const offers = offersData?.items ?? [];
  const candidacies = candidaciesData?.items ?? [];

  const columns: ColumnsType<Offer> = [
    {
      title: "Кандидат",
      key: "candidate",
      width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.candidateFullName}</div>
        </div>
      ),
    },
    {
      title: "Зарплата",
      key: "salary",
      width: 160,
      render: (_, r) => r.salaryFrom || r.salaryTo
        ? `${r.salaryFrom ?? "—"}–${r.salaryTo ?? "—"} ${r.currency ?? "₽"}`
        : "—",
    },
    {
      title: "Дата старта",
      dataIndex: "startDate",
      key: "startDate",
      width: 140,
      render: (v?: string) => v ? new Date(v).toLocaleDateString("ru-RU") : "—",
    },
    {
      title: "Срок ответа",
      dataIndex: "deadline",
      key: "deadline",
      width: 140,
      render: (v?: string) => v ? new Date(v).toLocaleDateString("ru-RU") : "—",
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || "default"}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: "Действия",
      key: "actions",
      width: 280,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" onClick={() => setDetailOffer(r)}>
            Подробнее
          </Button>
          {r.status === "draft" && (
            <Popconfirm title="Отправить оффер?" onConfirm={() => sendMut.mutate(r.id)}>
              <Button size="small" type="link">Отправить</Button>
            </Popconfirm>
          )}
          {r.status === "sent" && (
            <>
              <Popconfirm title="Принять оффер?" onConfirm={() => acceptMut.mutate(r.id)}>
                <Button size="small" type="link">Принять</Button>
              </Popconfirm>
              <Popconfirm title="Отклонить оффер?" onConfirm={() => declineMut.mutate(r.id)}>
                <Button size="small" type="link" danger>Отклонить</Button>
              </Popconfirm>
              <Popconfirm title="Отозвать оффер?" onConfirm={() => withdrawMut.mutate(r.id)}>
                <Button size="small" type="link">Отозвать</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        title={vacancy?.title ?? "Офферы"}
        sub="Управление офферами по вакансии"
        actions={
          <Button type="primary" onClick={() => { form.resetFields(); setCreateOpen(true); }}>
            Создать оффер
          </Button>
        }
      />

      <div className={s.panel}>
        <div className={s.filters}>
          <Segmented
            options={[
              { label: "Все", value: "all" },
              { label: "Черновики", value: "draft" },
              { label: "Отправлены", value: "sent" },
              { label: "Приняты", value: "accepted" },
              { label: "Отклонены", value: "declined" },
              { label: "Отозваны", value: "withdrawn" },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string)}
          />
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <Skeleton active />
        ) : (
          <Table<Offer>
            columns={columns}
            dataSource={offers}
            rowKey="id"
            locale={{ emptyText: "Нет офферов" }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        )}
      </div>

      <Modal
        title="Создать оффер"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMut.mutate(values)}
        >
          <Form.Item label="Кандидатура" name="candidacyId" rules={[{ required: true, message: "Выберите кандидата" }]}>
            <Select
              placeholder="Выберите кандидата"
              options={candidacies.map((c) => ({
                value: c.candidacyId,
                label: c.candidateFullName,
              }))}
            />
          </Form.Item>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item label="Зарплата от" name="salaryFrom" style={{ flex: 1 }}>
              <Input type="number" min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Зарплата до" name="salaryTo" style={{ flex: 1 }}>
              <Input type="number" min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item label="Валюта" name="currency" initialValue="RUB">
            <Select
              options={[
                { value: "RUB", label: "₽" },
                { value: "USD", label: "$" },
                { value: "EUR", label: "€" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Дата выхода" name="startDate">
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Срок ответа" name="deadline">
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Условия" name="conditions">
            <Input.TextArea rows={3} placeholder="Условия оффера" />
          </Form.Item>
          <Form.Item label="Бенефиты" name="benefits">
            <Input.TextArea rows={2} placeholder="Бенефиты и бонусы" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>
              Создать оффер
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Оффер"
        open={!!detailOffer}
        onCancel={() => setDetailOffer(null)}
        footer={null}
        width={640}
      >
        {detailOffer && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Кандидат" span={2}>{detailOffer.candidateFullName}</Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={STATUS_COLORS[detailOffer.status] || "default"}>{STATUS_LABELS[detailOffer.status] || detailOffer.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Зарплата">
              {detailOffer.salaryFrom || detailOffer.salaryTo
                ? `${detailOffer.salaryFrom ?? "—"}–${detailOffer.salaryTo ?? "—"} ${detailOffer.currency ?? "₽"}`
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Дата выхода">
              {detailOffer.startDate ? new Date(detailOffer.startDate).toLocaleDateString("ru-RU") : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Срок ответа">
              {detailOffer.deadline ? new Date(detailOffer.deadline).toLocaleDateString("ru-RU") : "—"}
            </Descriptions.Item>
            {detailOffer.conditions && (
              <Descriptions.Item label="Условия" span={2}>{detailOffer.conditions}</Descriptions.Item>
            )}
            {detailOffer.benefits && (
              <Descriptions.Item label="Бенефиты" span={2}>{detailOffer.benefits}</Descriptions.Item>
            )}
            {detailOffer.sentAt && (
              <Descriptions.Item label="Отправлен">
                {new Date(detailOffer.sentAt).toLocaleDateString("ru-RU")}
              </Descriptions.Item>
            )}
            {detailOffer.respondedAt && (
              <Descriptions.Item label="Ответ">
                {new Date(detailOffer.respondedAt).toLocaleDateString("ru-RU")}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
