"use client";

import { useState } from "react";
import { Button, Segmented } from "antd";
import { PageHeader } from "@/components/PageHeader";
import s from "./messages.module.css";

export default function MessagesPage() {
  const [tab, setTab] = useState("all");
  const [subTab, setSubTab] = useState("active");

  return (
    <div className={s.page}>
      <PageHeader
        title="Сообщения"
        sub="Кандидаты, которые ждут ответа"
      />

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === "all" ? s.tabActive : ""}`}
          onClick={() => setTab("all")}
        >
          Все сообщения
        </button>
        <button
          className={`${s.tab} ${tab === "vacancy" ? s.tabActive : ""}`}
          onClick={() => setTab("vacancy")}
        >
          По вакансиям
        </button>
      </div>

      <div className={s.subTabs}>
        <Segmented
          options={["Активные", "Архив"]}
          value={subTab === "active" ? "Активные" : "Архив"}
          onChange={(v) => setSubTab(v === "Активные" ? "active" : "archive")}
          size="small"
        />
        <Button size="small">Фильтры</Button>
        <Button size="small" type="text">Только мои вакансии</Button>
        <Button size="small" type="text">Показывать сопроводительные</Button>
      </div>

      <div className={s.panel}>
        <div className={s.empty}>
          <div className={s.emptyTitle}>Никто не ждёт ответа</div>
          <div className={s.emptyHint}>
            В очереди — только кандидаты, написавшие за последние 30 дней.
          </div>
        </div>
      </div>
    </div>
  );
}
