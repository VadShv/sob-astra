"use client";

import { Button } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import s from "./integrations.module.css";

interface IntegrationCard {
  name: string;
  connected: boolean;
  account?: string;
  meta?: { label: string; value: string }[];
  actionLabel: string;
}

const EMAIL_INTEGRATIONS: IntegrationCard[] = [
  { name: "Яндекс Почта и Яндекс 360", connected: false, actionLabel: "Войти через Яндекс" },
  { name: "Microsoft 365 и Outlook", connected: false, actionLabel: "Войти через Microsoft" },
  { name: "Свой сервер Exchange", connected: false, actionLabel: "Подключить Exchange" },
  { name: "Другая почта — IMAP/SMTP", connected: false, actionLabel: "Подключить по IMAP" },
];

const JOB_INTEGRATIONS: IntegrationCard[] = [
  {
    name: "hh.ru",
    connected: true,
    account: "vserzhantov@astralinux.ru",
    meta: [
      { label: "Работодатель", value: "Группа компаний Астра" },
      { label: "Менеджер на hh.ru", value: "vserzhantov@astralinux.ru" },
    ],
    actionLabel: "Сменить аккаунт",
  },
];

function IntegrationCardItem({ card }: { card: IntegrationCard }) {
  return (
    <div className={s.card}>
      <div className={s.cardName}>{card.name}</div>
      <div className={s.cardStatus}>
        {card.connected ? (
          <span className={s.cardConnected}>Подключено</span>
        ) : (
          "Не подключено"
        )}
      </div>
      {card.account && (
        <div className={s.cardMeta}>
          <div className={s.cardMetaRow}>
            <span className={s.cardMetaLabel}>Аккаунт</span>
            <span>{card.account}</span>
          </div>
          {card.meta?.map((m) => (
            <div key={m.label} className={s.cardMetaRow}>
              <span className={s.cardMetaLabel}>{m.label}</span>
              <span>{m.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className={s.cardActions}>
        <Button type="primary" size="small">
          {card.actionLabel}
        </Button>
        {card.connected && (
          <Button size="small" danger type="text">
            Отключить
          </Button>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <SettingsLayout activeItem="Интеграции">
      <div className={s.integrations}>
        <div className={s.section}>
          <h3 className={s.sectionTitle}>Почта</h3>
          <p className={s.sectionDesc}>
            Ваш личный ящик: с него уходят письма кандидатам, ответы приходят в
            переписку
          </p>
          <div className={s.cards}>
            {EMAIL_INTEGRATIONS.map((card) => (
              <IntegrationCardItem key={card.name} card={card} />
            ))}
          </div>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>Работные сайты</h3>
          <p className={s.sectionDesc}>
            Площадки, откуда приходят отклики и куда уходят сообщения кандидатам
          </p>
          <div className={s.cards}>
            {JOB_INTEGRATIONS.map((card) => (
              <IntegrationCardItem key={card.name} card={card} />
            ))}
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
