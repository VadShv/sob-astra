"use client";

import { Button, Segmented } from "antd";
import { PageHeader } from "@/components/PageHeader";
import s from "./analytics.module.css";

const FUNNEL_STAGES_RESPONSES = [
  "Откликнулись",
  "Оценено ИИ",
  "Прошли требования",
  "Приглашены на интервью",
  "Прошли интервью",
  "Одобрено",
];

const FUNNEL_STAGES_COLD = [
  "Оценено ИИ",
  "Прошли требования",
  "Приглашены на интервью",
  "Прошли интервью",
  "Одобрено",
];

function Funnel({ title, desc, stages }: { title: string; desc: string; stages: string[] }) {
  return (
    <div className={s.funnelSection}>
      <div>
        <h3 className={s.funnelTitle}>Воронка · {title}</h3>
        <p className={s.funnelDesc}>{desc}</p>
      </div>
      <div className={s.funnelSteps}>
        {stages.map((stage, i) => (
          <div key={stage} style={{ display: "flex", alignItems: "center" }}>
            <div className={s.funnelStep}>
              <span className={s.funnelStepNumber}>0</span>
              <span className={s.funnelStepLabel}>{stage}</span>
            </div>
            {i < stages.length - 1 && <span className={s.funnelArrow}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className={s.page}>
      <PageHeader
        title="Аналитика найма"
        sub="Дашборд подбора"
        actions={
          <>
            <Button>Журнал выгрузок</Button>
            <Button type="primary">Выгрузить в Excel</Button>
          </>
        }
      />

      <div className={s.filters}>
        <Segmented options={["Текущий квартал", "Этот месяц", "Этот год"]} size="small" />
        <Segmented options={["Все рекрутеры"]} size="small" />
        <Segmented options={["Все вакансии"]} size="small" />
      </div>

      <div className={s.kpiSection}>
        <h2 className={s.kpiTitle}>Что сделал ИИ</h2>
        <div className={s.kpiGrid}>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Экономия времени рекрутёра</span>
            <span className={s.kpiValue}>0 ч</span>
            <span className={s.kpiHint}>Сколько заняла бы та же работа вручную.</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Сэкономлено</span>
            <span className={s.kpiValue}>0 ч</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Резюме разобрано ИИ</span>
            <span className={s.kpiValue}>0</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Интервью ИИ проведено</span>
            <span className={s.kpiValue}>0</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Одобрено кандидатов</span>
            <span className={s.kpiValue}>0</span>
          </div>
        </div>
      </div>

      <Funnel
        title="Отклики"
        desc="Кандидаты, которые откликнулись сами, — от отклика до итога интервью."
        stages={FUNNEL_STAGES_RESPONSES}
      />

      <Funnel
        title="Холодный поиск"
        desc="Кандидаты из базы hh — от оценки резюме ИИ до итога интервью."
        stages={FUNNEL_STAGES_COLD}
      />
    </div>
  );
}
