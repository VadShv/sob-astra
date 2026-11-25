"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Button, Skeleton, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { authApi, appApi, type Vacancy } from "@/lib/api";
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

function buildColumns(): ColumnsType<Vacancy> {
  return [
    {
      title: "Вакансия",
      dataIndex: "title",
      key: "title",
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
    },
    {
      title: "Рекрутер",
      key: "recruiter",
      render: (_: unknown, record: Vacancy) => {
        const names = record.recruiters?.map((r) => r.name) ?? [];
        if (names.length === 0 && record.hrName) return record.hrName;
        return names.join(", ") || "—";
      },
    },
    {
      title: "Статус",
      dataIndex: "statusLabel",
      key: "status",
      render: (label: string, record: Vacancy) => {
        const color =
          record.status === "active" ? "green" :
          record.status === "paused" ? "orange" :
          record.status === "closed" ? "default" : "blue";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Кандидаты",
      key: "candidates",
      align: "center",
      render: (_: unknown, record: Vacancy) => {
        const total = record.stageCounts?.reduce((sum, sc) => sum + sc.count, 0) ?? 0;
        return total;
      },
    },
    {
      title: "Ждут решения",
      dataIndex: "awaitingDecisionCount",
      key: "awaiting",
      align: "center",
      render: (count: number) => count || "",
    },
    {
      title: "Откуда → куда",
      key: "chain",
      render: (_: unknown, record: Vacancy) => {
        const src = record.SourceIntegrationVacancy?.integrationType ?? "";
        const sink = record.SinkIntegrationVacancy?.integrationType ?? "";
        if (!src && !sink) return null;
        return (
          <span style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>
            {src && <Tag>{src}</Tag>}
            {src && sink && "→ "}
            {sink && <Tag>{sink}</Tag>}
          </span>
        );
      },
    },
    {
      title: "ИИ-модули",
      key: "modules",
      align: "center",
      render: (_: unknown, record: Vacancy) =>
        record.interviewsCount > 0 ? (
          <Tooltip title={`${record.interviewsCount} интервью ИИ`}>
            <Tag color="purple">{record.interviewsCount}</Tag>
          </Tooltip>
        ) : null,
    },
  ];
}

export default function HomePage() {
  const { data: userResp } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
  });

  const { data: vacancies, isLoading } = useQuery({
    queryKey: ["vacancies-active"],
    queryFn: () =>
      appApi.getVacancies({
        status: "active,paused,distribution",
        showAllVacancies: "true",
        groupMulti: "true",
        page: "1",
        pageSize: "20",
      }),
  });

  const { data: facets } = useQuery({
    queryKey: ["vacancy-facets"],
    queryFn: () =>
      appApi.getVacancyFacets({
        status: "active,paused,distribution",
      }),
  });

  const userName = userResp?.user?.first_name ?? "";
  const greeting = getGreeting();
  const dateStr = formatDate();
  const items = vacancies?.items ?? [];
  const total = facets?.total ?? items.length;

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
          </div>
        }
      />

      <section className={s.portfolio}>
        <div className={s.panel}>
          <div className={s.blockHead}>
            <h2 className={s.blockTitle}>Вакансии</h2>
            <div className={s.filters}>
              <Button size="small" type="primary">В работе</Button>
              <Button size="small">На паузе</Button>
              <Button size="small" type="text">Показать закрытые</Button>
              <Button size="small" type="text">Столбцы</Button>
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
                  selectedRowKeys: [],
                }}
                pagination={false}
                size="middle"
                scroll={{ x: true }}
              />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
            <Button type="primary">Создать</Button>
            <span style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
              Выбрать на странице ({items.length})
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
