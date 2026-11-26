"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, Tag, Skeleton, Segmented, Popconfirm, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { usePageTitle } from "@/components/usePageTitle";
import { appApi, type Meeting } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import s from "./calendar.module.css";

type StatusFilter = "all" | "upcoming" | "completed" | "cancelled";

const statusLabel: Record<string, string> = {
  upcoming: "Запланирована",
  completed: "Завершена",
  cancelled: "Отменена",
};

const statusColor: Record<string, string> = {
  upcoming: "blue",
  completed: "green",
  cancelled: "red",
};

export default function CalendarPage() {
  const qc = useQueryClient();
  usePageTitle("Календарь");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [resultOpen, setResultOpen] = useState(false);
  const [resultMeetingId, setResultMeetingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const params: Record<string, string> = filter === "all" ? {} : { status: filter };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.meetings.list(params),
    queryFn: () => appApi.getMeetings(params),
    placeholderData: keepPreviousData,
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => appApi.cancelMeeting(id),
    onSuccess: () => {
      message.success("Встреча отменена");
      qc.invalidateQueries({ queryKey: qk.meetings.all() });
    },
    onError: () => message.error("Не удалось отменить встречу"),
  });

  const resultMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      appApi.setMeetingResult(id, payload),
    onSuccess: () => {
      message.success("Результат сохранён");
      setResultOpen(false);
      form.resetFields();
      qc.invalidateQueries({ queryKey: qk.meetings.all() });
    },
    onError: () => message.error("Не удалось сохранить результат"),
  });

  const items = data?.items ?? [];

  const columns: ColumnsType<Meeting> = [
    { title: "Название", dataIndex: "title", key: "title", render: (v: string) => v || "—" },
    { title: "Кандидат", dataIndex: "candidateName", key: "candidateName", render: (v: string) => v || "—" },
    { title: "Вакансия", dataIndex: "vacancyTitle", key: "vacancyTitle", render: (v: string) => v || "—" },
    {
      title: "Начало",
      dataIndex: "startedAt",
      key: "startedAt",
      render: (v: string) => (v ? formatDateTime(v) : "—"),
    },
    {
      title: "Длительность",
      dataIndex: "duration",
      key: "duration",
      render: (v?: number) => (v != null ? `${v} мин` : "—"),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={statusColor[v] ?? "default"}>{statusLabel[v] ?? v}</Tag>,
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.link && (
            <Button type="link" size="small" href={record.link} target="_blank">
              Ссылка
            </Button>
          )}
          {record.status !== "cancelled" && (
            <Button
              type="text"
              size="small"
              onClick={() => {
                setResultMeetingId(record.id);
                form.setFieldsValue({ result: record.result ?? "" });
                setResultOpen(true);
              }}
            >
              Результат
            </Button>
          )}
          {record.status === "upcoming" && (
            <Popconfirm title="Отменить встречу?" onConfirm={() => cancelMut.mutate(record.id)}>
              <Button type="text" size="small" danger>
                Отменить
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader title="Календарь" sub="Запланированные встречи и интервью" />
      <div className={s.panel}>
        <div className={s.filters}>
          <Segmented
            options={[
              { label: "Все", value: "all" },
              { label: "Предстоящие", value: "upcoming" },
              { label: "Завершённые", value: "completed" },
              { label: "Отменённые", value: "cancelled" },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as StatusFilter)}
          />
        </div>
      </div>
      <div className={s.panel}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <Skeleton active />
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--ats-text-3, rgba(0,0,0,.45))" }}>
            Нет встреч
          </div>
        ) : (
          <Table<Meeting>
            columns={columns}
            dataSource={items}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            size="middle"
            locale={{ emptyText: "Нет встреч" }}
          />
        )}
      </div>
      <Modal
        title="Результат встречи"
        open={resultOpen}
        onCancel={() => setResultOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            if (resultMeetingId) resultMut.mutate({ id: resultMeetingId, payload: { result: values.result } });
          });
        }}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={resultMut.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Результат" name="result">
            <Input.TextArea rows={4} placeholder="Опишите итог встречи…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
