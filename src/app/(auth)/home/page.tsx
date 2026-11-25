"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Tag, Button, Skeleton, Tooltip, Modal, Form, Input, Select, Dropdown, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { authApi, appApi, type Vacancy, type HiringKpi } from "@/lib/api";
import s from "./home.module.css";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "доброе утро!";
  if (h >= 12 && h < 18) return "добрый день!";
  if (h >= 18 && h < 23) return "добрый вечер!";
  return "доброй ночи!";
}

function formatDate(): string {
  const days = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
  const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatSearchDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `поиск с ${dd}.${m}`;
}

const COLUMN_OPTIONS = [
  { label: "Вакансия", key: "title", default: true },
  { label: "Рекрутер", key: "recruiter", default: true },
  { label: "Статус", key: "status", default: true },
  { label: "Кандидаты", key: "candidates", default: true },
  { label: "Ждут решения", key: "awaiting", default: true },
  { label: "Откуда → куда", key: "chain", default: true },
  { label: "ИИ-модули", key: "modules", default: true },
  { label: "Планируем найм", key: "plannedHires", default: false },
  { label: "Дедлайн", key: "deadline", default: false },
  { label: "Грейд", key: "grade", default: false },
];

export default function HomePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(COLUMN_OPTIONS.filter((c) => c.default).map((c) => c.key))
  );
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string>("active,paused,distribution");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: userResp } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
  });

  const { data: vacancies, isLoading } = useQuery({
    queryKey: ["vacancies-active", statusFilter, page, pageSize, sortBy, sortOrder],
    queryFn: () =>
      appApi.getVacancies({
        status: statusFilter,
        showAllVacancies: "true",
        groupMulti: "true",
        page: String(page),
        pageSize: String(pageSize),
        ...(sortBy ? { sortBy, sortOrder } : {}),
      }),
  });

  const { data: facets } = useQuery({
    queryKey: ["vacancy-facets", statusFilter],
    queryFn: () => appApi.getVacancyFacets({ status: statusFilter }),
  });

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.createVacancy(payload),
    onSuccess: (resp) => {
      message.success("Вакансия создана");
      qc.invalidateQueries({ queryKey: ["vacancies-active"] });
      setCreateOpen(false);
      form.resetFields();
      router.push(`/vacancy/${resp.id}`);
    },
    onError: () => message.error("Не удалось создать вакансию"),
  });

  const { data: kpi } = useQuery({
    queryKey: ["hiring-kpi"],
    queryFn: () =>
      appApi.getHiringKpi({
        from: new Date(Date.now() - 90 * 86400000).toISOString(),
        to: new Date().toISOString(),
        tzOffset: "-180",
      }),
  });

  const userName = userResp?.user?.first_name ?? "";
  const greeting = getGreeting();
  const dateStr = formatDate();
  const items = vacancies?.items ?? [];
  const total = facets?.total ?? items.length;

  const buildColumns = (): ColumnsType<Vacancy> => {
    const cols: ColumnsType<Vacancy> = [];
    const has = (key: string) => selectedColumns.has(key);

    if (has("title")) {
      cols.push({
        title: "Вакансия",
        dataIndex: "title",
        key: "title",
        sorter: true,
        render: (title: string, record: Vacancy) => (
          <div>
            <div style={{ fontWeight: 600 }}>
              {record.isConfidential ? `${title} 🔒` : title}
            </div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>
              {formatSearchDate(record.searchStartedAt)}
            </div>
            {record.hhReconnectRequired && (
              <Tag color="warning" style={{ marginTop: 4, fontSize: 11 }}>
                Переподключить hh.ru
              </Tag>
            )}
          </div>
        ),
      });
    }
    if (has("recruiter")) {
      cols.push({
        title: "Рекрутер",
        key: "recruiter",
        render: (_: unknown, r: Vacancy) => {
          const names = r.recruiters?.map((x) => x.name) ?? [];
          return names.length ? names.join(", ") : r.hrName || "—";
        },
      });
    }
    if (has("status")) {
      cols.push({
        title: "Статус",
        dataIndex: "statusLabel",
        key: "status",
        render: (label: string, r: Vacancy) => {
          const color = r.status === "active" ? "green" : r.status === "paused" ? "orange" : "default";
          return <Tag color={color}>{label}</Tag>;
        },
      });
    }
    if (has("candidates")) {
      cols.push({
        title: "Кандидаты",
        key: "candidates",
        align: "center",
        render: (_: unknown, r: Vacancy) => r.stageCounts?.reduce((s, sc) => s + sc.count, 0) ?? 0,
      });
    }
    if (has("awaiting")) {
      cols.push({
        title: "Ждут решения",
        dataIndex: "awaitingDecisionCount",
        key: "awaiting",
        align: "center",
        render: (c: number) => c || "",
      });
    }
    if (has("chain")) {
      cols.push({
        title: "Откуда → куда",
        key: "chain",
        render: (_: unknown, r: Vacancy) => {
          const src = r.SourceIntegrationVacancy?.integrationType;
          const sink = r.SinkIntegrationVacancy?.integrationType;
          if (!src && !sink) return null;
          return (
            <span style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>
              {src && <Tag>{src}</Tag>}
              {src && sink && "→ "}
              {sink && <Tag>{sink}</Tag>}
            </span>
          );
        },
      });
    }
    if (has("modules")) {
      cols.push({
        title: "ИИ-модули",
        key: "modules",
        align: "center",
        render: (_: unknown, r: Vacancy) =>
          r.interviewsCount > 0 ? (
            <Tooltip title={`${r.interviewsCount} интервью ИИ`}>
              <Tag color="purple">{r.interviewsCount}</Tag>
            </Tooltip>
          ) : null,
      });
    }
    if (has("plannedHires")) {
      cols.push({ title: "План", dataIndex: "plannedHires", key: "plannedHires", align: "center" });
    }
    if (has("deadline")) {
      cols.push({
        title: "Дедлайн",
        dataIndex: "deadline",
        key: "deadline",
        render: (d: string) => (d ? new Date(d).toLocaleDateString("ru") : "—"),
      });
    }
    return cols;
  };

  const kpiData = kpi as HiringKpi | undefined;
  const ttf = kpiData?.timeToFill;
  const tto = kpiData?.timeToOffer;
  const oa = kpiData?.offerAcceptance;

  return (
    <div className={s.page}>
      <PageHeader
        title={`${userName ? userName + ", " : ""}${greeting}`}
        sub={dateStr}
        actions={
          <div className={s.tiles}>
            <div className={s.tile}>
              <span className={s.tileNumber} data-tone="purple">{total}</span>
              <div className={s.tileText}>
                <span className={s.tileTitle}>Вакансий</span>
                <span className={s.tileNote}>в работе</span>
              </div>
            </div>
            <div className={s.tile}>
              <span className={s.tileNumber} data-tone="lime">
                {ttf?.medianDays ?? "—"}
              </span>
              <div className={s.tileText}>
                <span className={s.tileTitle}>Дней до найма</span>
                <span className={s.tileNote}>медиана</span>
              </div>
            </div>
            <div className={s.tile}>
              <span className={s.tileNumber} data-tone="pink">
                {oa?.rate != null ? `${Math.round(oa.rate * 100)}%` : "—"}
              </span>
              <div className={s.tileText}>
                <span className={s.tileTitle}>Приём офферов</span>
                <span className={s.tileNote}>{oa?.accepted ?? 0} принято</span>
              </div>
            </div>
          </div>
        }
      />

      <section className={s.portfolio}>
        <div className={s.panel}>
          <div className={s.blockHead}>
            <h2 className={s.blockTitle}>Вакансии</h2>
            <div className={s.filters}>
              <Button size="small" type={statusFilter === "active,paused,distribution" ? "primary" : "default"} onClick={() => setStatusFilter("active,paused,distribution")}>В работе</Button>
              <Button size="small" type={statusFilter === "paused" ? "primary" : "default"} onClick={() => setStatusFilter("paused")}>На паузе</Button>
              <Button size="small" type={statusFilter === "closed" ? "primary" : "text"} onClick={() => setStatusFilter("closed")}>Показать закрытые</Button>
              <Dropdown
                menu={{
                  items: COLUMN_OPTIONS.map((c) => ({
                    key: c.key,
                    label: c.label,
                  })),
                  selectable: true,
                  selectedKeys: Array.from(selectedColumns),
                  onClick: ({ key }) => {
                    const next = new Set(selectedColumns);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    setSelectedColumns(next);
                  },
                }}
                trigger={["click"]}
              >
                <Button size="small" type="text">Столбцы</Button>
              </Dropdown>
            </div>
            <span className={s.count} style={{ marginLeft: "auto" }}>
              {items.length} из {total} вакансий
            </span>
          </div>
          <div className={s.tableWrap}>
            {isLoading ? (
              <Skeleton active />
            ) : (
              <Table<Vacancy>
                columns={buildColumns()}
                dataSource={items}
                rowKey="id"
                rowSelection={{
                  type: "checkbox",
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                }}
                onRow={(record) => ({
                  onClick: () => router.push(`/vacancy/${record.id}`),
                  style: { cursor: "pointer" },
                })}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  showSizeChanger: true,
                  showTotal: (t) => `${t} вакансий`,
                  onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                }}
                onChange={(_pagination, _filters, sorter) => {
                  const s = Array.isArray(sorter) ? sorter[0] : sorter;
                  if (s?.field) {
                    setSortBy(String(s.field));
                    setSortOrder(s.order === "descend" ? "desc" : "asc");
                  } else {
                    setSortBy("");
                  }
                }}
                size="middle"
                scroll={{ x: true }}
              />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Button type="primary" onClick={() => setCreateOpen(true)}>
                Создать
              </Button>
              {selectedRowKeys.length > 0 && (
                <>
                  <Button onClick={() => message.info("Пауза — в разработке")}>Пауза</Button>
                  <Button onClick={() => message.info("Активировать — в разработке")}>Активировать</Button>
                  <Button onClick={() => message.info("Закрыть — в разработке")}>Закрыть</Button>
                  <Button danger onClick={() => { setSelectedRowKeys([]); message.info("Удаление — в разработке")}}>Удалить</Button>
                  <Button type="text" onClick={() => setSelectedRowKeys([])}>Снять выделение</Button>
                </>
              )}
            </div>
            <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
              {selectedRowKeys.length > 0
                ? `Выбрано: ${selectedRowKeys.length}`
                : `Выбрать на странице (${items.length})`}
            </span>
          </div>
        </div>
      </section>

      <Modal
        title="Новая вакансия"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => createMut.mutate(values));
        }}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createMut.isPending}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Название вакансии" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Frontend разработчик" />
          </Form.Item>
          <Form.Item label="Подразделение" name="orgUnit">
            <Select options={[{ value: "main", label: "Основное" }]} />
          </Form.Item>
          <Form.Item label="Планируем найм" name="plannedHires">
            <Input type="number" min={1} defaultValue={1} />
          </Form.Item>
          <Form.Item label="Рекрутер" name="recruiter">
            <Select
              options={(facets?.recruiters ?? []).map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Выберите рекрутера"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
