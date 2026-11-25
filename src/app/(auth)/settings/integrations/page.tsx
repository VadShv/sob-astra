"use client";

import { Button, Skeleton, message, Popconfirm } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi, authApi } from "@/lib/api";
import s from "./integrations.module.css";

interface IntegrationCard {
  name: string;
  integrationType: string;
  connected: boolean;
  account?: string;
  meta?: { label: string; value: string }[];
  actionLabel: string;
  oauthUrl?: string;
}

const EMAIL_INTEGRATIONS: IntegrationCard[] = [
  { name: "Яндекс Почта и Яндекс 360", integrationType: "yandex-mail", connected: false, actionLabel: "Войти через Яндекс" },
  { name: "Microsoft 365 и Outlook", integrationType: "microsoft", connected: false, actionLabel: "Войти через Microsoft" },
  { name: "Свой сервер Exchange", integrationType: "exchange", connected: false, actionLabel: "Подключить Exchange" },
  { name: "Другая почта — IMAP/SMTP", integrationType: "imap", connected: false, actionLabel: "Подключить по IMAP" },
];

const JOB_INTEGRATIONS: IntegrationCard[] = [
  { name: "hh.ru", integrationType: "hh", connected: false, actionLabel: "Подключить hh.ru", oauthUrl: authApi.hhAuthUrl() },
  { name: "Авито", integrationType: "avito", connected: false, actionLabel: "Подключить Авито" },
  { name: "SuperJob", integrationType: "superjob", connected: false, actionLabel: "Подключить SuperJob" },
];

function IntegrationCardItem({
  card,
  onConnect,
  onDisconnect,
  connecting,
}: {
  card: IntegrationCard;
  onConnect: (card: IntegrationCard) => void;
  onDisconnect: (integrationType: string) => void;
  connecting: boolean;
}) {
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
        <Button
          type="primary"
          size="small"
          loading={connecting}
          onClick={() => onConnect(card)}
        >
          {card.actionLabel}
        </Button>
        {card.connected && (
          <Popconfirm
            title="Отключить интеграцию?"
            onConfirm={() => onDisconnect(card.integrationType)}
          >
            <Button size="small" danger type="text">
              Отключить
            </Button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const qc = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => appApi.getIntegrations(),
  });

  const { data: userResp } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
  });

  const connectMut = useMutation({
    mutationFn: ({ type, payload }: { type: string; payload?: Record<string, unknown> }) =>
      appApi.connectIntegration(type, payload),
    onSuccess: () => {
      message.success("Интеграция подключена");
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: () => message.error("Не удалось подключить"),
  });

  const disconnectMut = useMutation({
    mutationFn: (type: string) => appApi.disconnectIntegration(type),
    onSuccess: () => {
      message.success("Интеграция отключена");
      qc.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: () => message.error("Не удалось отключить"),
  });

  const integrationsData = integrations as Record<string, { connected?: boolean; account?: string }> | undefined;

  const mergeStatus = (cards: IntegrationCard[]): IntegrationCard[] =>
    cards.map((c) => {
      const live = integrationsData?.[c.integrationType];
      if (live?.connected) {
        return {
          ...c,
          connected: true,
          account: live.account ?? userResp?.user?.email,
          meta: c.integrationType === "hh" ? [
            { label: "Работодатель", value: "Группа компаний Астра" },
            { label: "Менеджер на hh.ru", value: live.account ?? userResp?.user?.email ?? "" },
          ] : c.meta,
          actionLabel: "Сменить аккаунт",
        };
      }
      return c;
    });

  const emailCards = mergeStatus(EMAIL_INTEGRATIONS);
  const jobCards = mergeStatus(JOB_INTEGRATIONS);

  const handleConnect = (card: IntegrationCard) => {
    if (card.oauthUrl) {
      window.location.href = card.oauthUrl;
      return;
    }
    connectMut.mutate({ type: card.integrationType });
  };

  return (
    <SettingsLayout activeItem="Интеграции">
      {isLoading ? (
        <Skeleton active />
      ) : (
        <div className={s.integrations}>
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Почта</h3>
            <p className={s.sectionDesc}>
              Ваш личный ящик: с него уходят письма кандидатам, ответы приходят в
              переписку
            </p>
            <div className={s.cards}>
              {emailCards.map((card) => (
                <IntegrationCardItem
                  key={card.name}
                  card={card}
                  onConnect={handleConnect}
                  onDisconnect={(t) => disconnectMut.mutate(t)}
                  connecting={connectMut.isPending}
                />
              ))}
            </div>
          </div>

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Работные сайты</h3>
            <p className={s.sectionDesc}>
              Площадки, откуда приходят отклики и куда уходят сообщения кандидатам
            </p>
            <div className={s.cards}>
              {jobCards.map((card) => (
                <IntegrationCardItem
                  key={card.name}
                  card={card}
                  onConnect={handleConnect}
                  onDisconnect={(t) => disconnectMut.mutate(t)}
                  connecting={connectMut.isPending}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
