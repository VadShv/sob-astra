"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, Select, Tag, Skeleton, Segmented, DatePicker, message, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Task } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
import { formatDate } from "@/lib/format";
import s from "./tasks.module.css";

type StatusFilter = "all" | "pending" | "in_progress" | "done";

const STATUS_FILTERS = [
  { label: "Все", value: "all" },
  { label: "Ожидают", value: "pending" },
  { label: "В работе", value: "in_progress" },
  { label: "Готово", value: "done" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  done: "Готово",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  in_progress: "blue",
  done: "green",
};

export default function TasksPage() {
  const router = useRouter();
  const qc = useQueryClient();
  usePageTitle("Задачи");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const params: Record<string, string> = {};
  if (statusFilter !== "all") params.status = statusFilter;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.tasks.list(params),
    queryFn: () => appApi.getTasks(params),
    placeholderData: keepPreviousData,
  });

  const { data: typesData } = useQuery({
    queryKey: qk.tasks.types(),
    queryFn: () => appApi.getTaskTypes(),
    staleTime: 300_000,
  });

  const { data: usersData } = useQuery({
    queryKey: qk.settings.companyUsers(),
    queryFn: () => appApi.getCompanyUsers(),
    staleTime: 300_000,
  });

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.createTask(payload),
    onSuccess: () => {
      message.success("Задача создана");
      qc.invalidateQueries({ queryKey: qk.tasks.all() });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать задачу"),
  });

  const items = data?.items ?? [];
  const typeOptions = (typesData?.items ?? []).map((t) => ({ value: t.id, label: t.name }));
  const assigneeOptions = (usersData?.items ?? []).map((u) => ({ value: u.id, label: u.name }));

  const columns: ColumnsType<Task> = [
    { title: "Название", dataIndex: "title", key: "title" },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? "default"}>
          {STATUS_LABELS[status] ?? status}
        </Tag>
      ),
    },
    { title: "Тип", dataIndex: "type", key: "type", render: (t: string) => t || "—" },
    {
      title: "Дедлайн",
      dataIndex: "deadline",
      key: "deadline",
      render: (d: string) => (d ? formatDate(d) : "—"),
    },
    {
      title: "Исполнитель",
      key: "assignee",
      render: (_, r) => r.assignee?.name ?? "—",
    },
    {
      title: "Связано",
      key: "links",
      render: (_, r) => {
        if (!r.vacancyId && !r.candidateId) return "—";
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {r.vacancyId && (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: "auto", textAlign: "left" }}
                onClick={() => router.push(`/vacancy/${r.vacancyId}`)}
              >
                {r.vacancyTitle || "Вакансия"}
              </Button>
            )}
            {r.candidateId && (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: "auto", textAlign: "left" }}
                onClick={() => router.push(`/candidate/${r.candidateId}`)}
              >
                {r.candidateName || "Кандидат"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        title="Задачи"
        sub="Управление задачами"
        actions={
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Создать задачу
          </Button>
        }
      />

      <div className={s.panel}>
        <div className={s.filters}>
          <Segmented
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            size="small"
          />
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <Skeleton active />
        ) : items.length === 0 ? (
          <Empty description="Нет задач" />
        ) : (
          <Table<Task>
            columns={columns}
            dataSource={items}
            rowKey="id"
            size="middle"
            scroll={{ x: true }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        )}
      </div>

      <Modal
        title="Новая задача"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              const payload: Record<string, unknown> = {
                title: values.title,
                description: values.description,
                type: values.type,
                assigneeId: values.assigneeId,
              };
              if (values.deadline) {
                payload.deadline = values.deadline.toISOString();
              }
              createMut.mutate(payload);
            })
            .catch(() => {});
        }}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createMut.isPending}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Название" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Позвонить кандидату" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} placeholder="Опишите задачу" />
          </Form.Item>
          <Form.Item label="Тип" name="type">
            <Select options={typeOptions} placeholder="Выберите тип" allowClear />
          </Form.Item>
          <Form.Item label="Дедлайн" name="deadline">
            <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Исполнитель" name="assigneeId">
            <Select options={assigneeOptions} placeholder="Выберите исполнителя" allowClear showSearch filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
