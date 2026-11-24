"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Button, Skeleton } from "antd";
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

const columns: ColumnsType<Vacancy> = [
  {
    title: "Вакансия",
    dataIndex: "title",
    key: "title",
    render: (title: string) => (
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
      </div>
    ),
  },
  {
    title: "Рекрутер",
    key: "recruiter",
    render: () => "—",
  },
  {
    title: "Статус",
    key: "status",
    render: () => <Tag color="green">В работе</Tag>,
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
    key: "pending",
    align: "center",
    render: () => 0,
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
          {src} → {sink}
        </span>
      );
    },
  },
  {
    title: "ИИ-модули",
    key: "modules",
    render: () => null,
  },
];

export default function HomePage() {
  const { data: userResp } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
  });

  const { data: vacancies, isLoading } = useQuery({
    queryKey: ["vacancies"],
    queryFn: () =>
      appApi.getVacancies({
        status: "active,paused,distribution",
        sortBy: "title",
        sortDirection: "asc",
        page: "1",
        pageSize: "20",
      }),
  });

  const userName = userResp?.user?.first_name ?? "";
  const greeting = getGreeting();
  const dateStr = formatDate();
  const items = vacancies?.items ?? [];

  return (
    <div className={s.page}>
      <PageHeader
        title={`${userName ? userName + ", " : ""}${greeting}`}
        sub={dateStr}
      />

      <section className={s.portfolio}>
        <div className={s.panel}>
          <div className={s.blockHead}>
            <h2 className={s.blockTitle}>Вакансии</h2>
            <div className={s.filters}>
              <Button size="small" type="primary">В работе</Button>
              <Button size="small">На паузе</Button>
              <Button size="small" type="text">Показать закрытые</Button>
            </div>
            <span className={s.count} style={{ marginLeft: "auto" }}>
              {items.length} из {items.length} вакансий
            </span>
          </div>
          <div className={s.tableWrap}>
            {isLoading ? (
              <Skeleton active />
            ) : (
              <Table<Vacancy>
                columns={columns}
                dataSource={items}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ x: true }}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
