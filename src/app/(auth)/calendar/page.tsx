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
  const [viewMode, setViewMode] = useState<"list" | "month">("month");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
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
    mutationFn: ({ id, payload }: { id: string; payload: { result: string; rating?: number } }) =>
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
              { label: "Календарь", value: "month" },
              { label: "Список", value: "list" },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as "list" | "month")}
          />
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
          {viewMode === "month" && (
            <Space>
              <Button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                ‹
              </Button>
              <span style={{ fontWeight: 600, minWidth: 140, textAlign: "center" }}>
                {currentMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
              </span>
              <Button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                ›
              </Button>
              <Button size="small" onClick={() => setCurrentMonth(new Date())}>Сегодня</Button>
            </Space>
          )}
        </div>
      </div>
      <div className={s.panel}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <Skeleton active />
        ) : viewMode === "month" ? (
          <MonthGrid meetings={items} currentMonth={currentMonth} />
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

function MonthGrid({ meetings, currentMonth }: { meetings: Meeting[]; currentMonth: Date }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className={s.monthGrid}>
      <div className={s.weekHeader}>
        {weekDays.map((wd) => (
          <div key={wd} className={s.weekDay}>{wd}</div>
        ))}
      </div>
      <div className={s.dayCells}>
        {cells.map((date, i) => {
          if (!date) return <div key={i} className={s.dayCell + " " + s.dayEmpty} />;
          const dayMeetings = meetings.filter((m) => {
            if (!m.startedAt) return false;
            const md = new Date(m.startedAt);
            return md.getFullYear() === date.getFullYear() && md.getMonth() === date.getMonth() && md.getDate() === date.getDate();
          });
          const isToday = date.getTime() === today.getTime();
          return (
            <div key={i} className={s.dayCell + (isToday ? " " + s.dayToday : "")}>
              <div className={s.dayNum}>{date.getDate()}</div>
              <div className={s.dayEvents}>
                {dayMeetings.slice(0, 3).map((m) => (
                  <div key={m.id} className={s.event + " " + s["event_" + (m.status ?? "upcoming")]}>
                    <span className={s.eventTime}>{m.startedAt ? new Date(m.startedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                    <span className={s.eventTitle}>{m.title || m.candidateName || "Встреча"}</span>
                  </div>
                ))}
                {dayMeetings.length > 3 && <div className={s.eventMore}>+{dayMeetings.length - 3} ещё</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
