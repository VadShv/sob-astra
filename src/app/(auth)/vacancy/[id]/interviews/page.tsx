"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Skeleton, Table, Tag, Button, Modal, Form, Input, Select,
  DatePicker, Space, message, Popconfirm, Segmented, Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi, type Interview } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./interviews.module.css";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "blue",
  completed: "green",
  cancelled: "red",
  no_show: "orange",
  draft: "default",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Запланировано",
  completed: "Проведено",
  cancelled: "Отменено",
  no_show: "Неявка",
  draft: "Черновик",
};

export default function InterviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  usePageTitle("Интервью · Вакансия");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [scorecardInterview, setScorecardInterview] = useState<Interview | null>(null);
  const [form] = Form.useForm();

  const { data: vacancy } = useQuery({
    queryKey: qk.vacancies.detail(id),
    queryFn: () => appApi.getVacancyById(id),
  });

  const { data: interviewsData, isLoading, isError, refetch } = useQuery({
    queryKey: qk.interviews.list(id, { status: statusFilter }),
    queryFn: () => appApi.getVacancyInterviews(id, {
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
  });

  const { data: types } = useQuery({
    queryKey: qk.interviews.types(),
    queryFn: () => appApi.getInterviewTypes(),
    staleTime: 300_000,
  });

  const { data: interviewers } = useQuery({
    queryKey: qk.interviews.interviewers(id),
    queryFn: () => appApi.getInterviewers(id),
    staleTime: 300_000,
  });

  const { data: facets } = useQuery({
    queryKey: qk.vacancies.detail(id),
    queryFn: () => appApi.getVacancyInterviewFacets(id),
  });

  const createMut = useMutation({
    mutationFn: (payload: Parameters<typeof appApi.createInterview>[0]) => appApi.createInterview(payload),
    onSuccess: () => {
      message.success("Интервью создано");
      qc.invalidateQueries({ queryKey: qk.interviews.list(id) });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать интервью"),
  });

  const cancelMut = useMutation({
    mutationFn: (interviewId: string) => appApi.cancelInterview(interviewId),
    onSuccess: () => {
      message.success("Интервью отменено");
      qc.invalidateQueries({ queryKey: qk.interviews.list(id) });
    },
    onError: () => message.error("Не удалось отменить"),
  });

  const candidacies = interviewsData?.candidacies ?? [];

  const columns: ColumnsType<Interview> = [
    {
      title: "Кандидат",
      key: "candidate",
      width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.candidateFullName}</div>
          {r.candidateEmail && <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>{r.candidateEmail}</div>}
        </div>
      ),
    },
    {
      title: "Тип",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Формат",
      dataIndex: "format",
      key: "format",
      width: 120,
    },
    {
      title: "Дата и время",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      width: 180,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString("ru-RU")}>
          {new Date(v).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </Tooltip>
      ),
    },
    {
      title: "Длительность",
      dataIndex: "durationMin",
      key: "durationMin",
      width: 100,
      render: (v: number) => `${v} мин`,
    },
    {
      title: "Интервьюеры",
      dataIndex: "interviewerNames",
      key: "interviewerNames",
      render: (names: string[]) => names?.join(", ") || "—",
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
      width: 180,
      render: (_, r) => (
        <Space>
          {r.status === "completed" && (
            <Button size="small" type="link" onClick={() => setScorecardInterview(r)}>
              Скоркарта
            </Button>
          )}
          {r.status === "scheduled" && (
            <Popconfirm title="Отменить интервью?" onConfirm={() => cancelMut.mutate(r.id)}>
              <Button size="small" type="link" danger>Отменить</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        title={vacancy?.title ?? "Интервью"}
        sub="Расписание интервью по вакансии"
        actions={
          <Button type="primary" onClick={() => { form.resetFields(); setCreateOpen(true); }}>
            Запланировать интервью
          </Button>
        }
      />

      {facets && (
        <div className={s.facets}>
          {facets.statuses.map((st) => (
            <Tag key={st.value} color={STATUS_COLORS[st.value] || "default"}>
              {STATUS_LABELS[st.value] || st.value}: {st.count}
            </Tag>
          ))}
        </div>
      )}

      <div className={s.panel}>
        <div className={s.filters}>
          <Segmented
            options={[
              { label: "Все", value: "all" },
              { label: "Запланированы", value: "scheduled" },
              { label: "Проведены", value: "completed" },
              { label: "Отменены", value: "cancelled" },
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
          <Table<Interview>
            columns={columns}
            dataSource={candidacies as unknown as Interview[]}
            rowKey="interviewId"
            locale={{ emptyText: "Нет запланированных интервью" }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        )}
      </div>

      <Modal
        title="Запланировать интервью"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            createMut.mutate({
              ...values,
              scheduledAt: values.scheduledAt.toISOString(),
              interviewerIds: values.interviewerIds,
            });
          }}
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
          <Form.Item label="Тип интервью" name="type" rules={[{ required: true, message: "Выберите тип" }]}>
            <Select
              placeholder="Выберите тип"
              options={types?.map((t) => ({ value: t.value, label: t.label })) ?? []}
            />
          </Form.Item>
          <Form.Item label="Формат" name="format" rules={[{ required: true, message: "Выберите формат" }]}>
            <Select
              placeholder="Выберите формат"
              options={[
                { value: "offline", label: "Офлайн" },
                { value: "online", label: "Онлайн" },
                { value: "phone", label: "Телефон" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Дата и время" name="scheduledAt" rules={[{ required: true, message: "Выберите дату" }]}>
            <DatePicker
              showTime
              format="DD.MM.YYYY HH:mm"
              style={{ width: "100%" }}
              disabledDate={(d) => d.isBefore(dayjs(), "day")}
            />
          </Form.Item>
          <Form.Item label="Длительность (мин)" name="durationMin" initialValue={60} rules={[{ required: true, message: "Введите длительность" }]}>
            <Input type="number" min={15} max={240} />
          </Form.Item>
          <Form.Item label="Место / ссылка" name="location">
            <Input placeholder="Адрес или ссылка на встречу" />
          </Form.Item>
          <Form.Item label="Интервьюеры" name="interviewerIds" rules={[{ required: true, message: "Выберите интервьюеров" }]}>
            <Select
              mode="multiple"
              placeholder="Выберите интервьюеров"
              options={interviewers?.map((i) => ({ value: i.id, label: i.name })) ?? []}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>
              Создать
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Скоркарта"
        open={!!scorecardInterview}
        onCancel={() => setScorecardInterview(null)}
        footer={null}
        width={640}
      >
        {scorecardInterview && <ScorecardView interviewId={scorecardInterview.id} />}
      </Modal>
    </div>
  );
}

function ScorecardView({ interviewId }: { interviewId: string }) {
  const { data: scorecard, isLoading } = useQuery({
    queryKey: qk.interviews.scorecard(interviewId),
    queryFn: () => appApi.getScorecard(interviewId),
    enabled: !!interviewId,
  });

  if (isLoading) return <Skeleton active />;
  if (!scorecard) return <div style={{ textAlign: "center", padding: 24, color: "rgba(0,0,0,.45)" }}>Скоркарта не заполнена</div>;

  return (
    <div>
      {scorecard.overallRating != null && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 600 }}>Общая оценка: </span>
          <Tag color={scorecard.overallRating >= 4 ? "green" : scorecard.overallRating >= 3 ? "blue" : "red"}>
            {scorecard.overallRating} / 5
          </Tag>
          {scorecard.recommendation && <Tag>{scorecard.recommendation}</Tag>}
        </div>
      )}
      {scorecard.sections.map((section) => (
        <div key={section.id} style={{ marginBottom: 16, padding: 12, border: "1px solid #f0f0f0", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>{section.name}</strong>
            {section.rating != null && <Tag>{section.rating} / 5</Tag>}
          </div>
          {section.skills?.map((sk) => (
            <div key={sk.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
              <span>{sk.name}</span>
              {sk.rating != null && <span style={{ color: "rgba(0,0,0,.45)" }}>{sk.rating} / 5</span>}
            </div>
          ))}
          {section.comment && <p style={{ fontSize: 13, color: "rgba(0,0,0,.65)", marginTop: 8 }}>{section.comment}</p>}
        </div>
      ))}
      {scorecard.summary && (
        <div style={{ padding: 12, background: "rgba(0,0,0,.02)", borderRadius: 8 }}>
          <strong>Итог: </strong>
          {scorecard.summary}
        </div>
      )}
    </div>
  );
}
