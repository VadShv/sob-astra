"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input, Tag, Skeleton, Button, Empty, Pagination } from "antd";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import s from "./jobs.module.css";

export default function PublicJobsPage() {
  usePageTitle("Вакансии · Собесо");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-vacancies", search, page],
    queryFn: () => appApi.getPublicVacancies({
      ...(search ? { q: search } : {}),
      page: String(page),
      pageSize: "10",
    }),
  });

  const vacancies = data?.items ?? [];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1>Карьера · Собесо</h1>
        <Input.Search
          placeholder="Поиск вакансий"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : vacancies.length === 0 ? (
        <Empty description="Нет открытых вакансий" />
      ) : (
        <>
          <div className={s.list}>
            {vacancies.map((v) => (
              <Card key={v.id} className={s.card} hoverable>
                <div className={s.cardHeader}>
                  <h3 className={s.cardTitle}>{v.title}</h3>
                  <Button type="primary" href={`/jobs/${v.id}`}>Откликнуться</Button>
                </div>
                <div className={s.cardMeta}>
                  {v.city && <Tag>{v.city}</Tag>}
                  {v.employmentType && <Tag>{v.employmentType}</Tag>}
                  {v.experience && <Tag>{v.experience}</Tag>}
                  {(v.salaryFrom || v.salaryTo) && (
                    <Tag color="green">{v.salaryFrom ?? "—"}–{v.salaryTo ?? "—"} ₽</Tag>
                  )}
                </div>
                {v.description && (
                  <p className={s.cardDesc}>{v.description.slice(0, 200)}{v.description.length > 200 ? "…" : ""}</p>
                )}
              </Card>
            ))}
          </div>
          {data && data.total > 10 && (
            <Pagination
              current={page}
              total={data.total}
              pageSize={10}
              onChange={setPage}
              style={{ textAlign: "center", marginTop: 16 }}
            />
          )}
        </>
      )}
    </div>
  );
}
