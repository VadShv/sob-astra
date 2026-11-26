"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Skeleton, Tag, Button, message, Descriptions, Input, Empty } from "antd";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./offer.module.css";

export default function OfferResponsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  usePageTitle("Оффер · Собесо");
  const [responded, setResponded] = useState<"accepted" | "declined" | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["offer-by-token", token],
    queryFn: () => appApi.getOfferByToken(token),
  });

  const acceptMut = useMutation({
    mutationFn: () => appApi.acceptOfferByToken(token),
    onSuccess: () => {
      message.success("Оффер принят! Поздравляем!");
      setResponded("accepted");
    },
    onError: () => message.error("Не удалось принять"),
  });

  const declineMut = useMutation({
    mutationFn: () => appApi.declineOfferByToken(token, declineReason),
    onSuccess: () => {
      message.success("Ответ отправлен");
      setResponded("declined");
    },
    onError: () => message.error("Не удалось отправить"),
  });

  if (isError) {
    return (
      <div className={s.page}>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className={s.page}>
        <Skeleton active />
      </div>
    );
  }

  if (responded === "accepted") {
    return (
      <div className={s.page}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <h1>🎉 Поздравляем!</h1>
          <p>Вы приняли оффер на должность <strong>{data.offer.vacancyTitle}</strong></p>
          <p style={{ color: "rgba(0,0,0,.45)" }}>HR-менеджер свяжется с вами для дальнейших шагов.</p>
        </Card>
      </div>
    );
  }

  if (responded === "declined") {
    return (
      <div className={s.page}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <h2>Ответ отправлен</h2>
          <p style={{ color: "rgba(0,0,0,.45)" }}>Вы отклонили оффер. Спасибо за время.</p>
        </Card>
      </div>
    );
  }

  if (data.status !== "sent") {
    return (
      <div className={s.page}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <Tag color={data.status === "accepted" ? "green" : "red"} style={{ fontSize: 14 }}>
            {data.status === "accepted" ? "Оффер уже принят" : "Оффер уже отклонён"}
          </Tag>
        </Card>
      </div>
    );
  }

  const { offer } = data;

  return (
    <div className={s.page}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1>Оффер</h1>
          <p style={{ color: "rgba(0,0,0,.45)" }}>
            {offer.companyName} · {offer.vacancyTitle}
          </p>
        </div>

        <Descriptions bordered column={1}>
          <Descriptions.Item label="Должность">{offer.vacancyTitle}</Descriptions.Item>
          {offer.salaryFrom || offer.salaryTo ? (
            <Descriptions.Item label="Зарплата">
              {offer.salaryFrom ?? "—"}–{offer.salaryTo ?? "—"} {offer.currency ?? "₽"}
            </Descriptions.Item>
          ) : null}
          {offer.startDate && (
            <Descriptions.Item label="Дата выхода">
              {new Date(offer.startDate).toLocaleDateString("ru-RU")}
            </Descriptions.Item>
          )}
          {offer.deadline && (
            <Descriptions.Item label="Срок ответа">
              {new Date(offer.deadline).toLocaleDateString("ru-RU")}
            </Descriptions.Item>
          )}
          {offer.conditions && (
            <Descriptions.Item label="Условия">{offer.conditions}</Descriptions.Item>
          )}
          {offer.benefits && (
            <Descriptions.Item label="Бенефиты">{offer.benefits}</Descriptions.Item>
          )}
        </Descriptions>

        {offer.body && (
          <div style={{ marginTop: 16, padding: 16, background: "rgba(0,0,0,.02)", borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {offer.body}
          </div>
        )}
      </Card>

      <Card title="Ваш ответ" style={{ marginTop: 16 }}>
        <p>Уважаемый(ая) {data.candidateName}, примете ли вы это предложение?</p>
        <div style={{ marginTop: 16 }}>
          <Input.TextArea
            placeholder="Причина отказа (необязательно)"
            rows={3}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <Button
              type="primary"
              size="large"
              loading={acceptMut.isPending}
              onClick={() => acceptMut.mutate()}
              style={{ background: "#52c41a" }}
            >
              Принимаю оффер
            </Button>
            <Button
              danger
              size="large"
              loading={declineMut.isPending}
              onClick={() => declineMut.mutate()}
            >
              Отклоняю
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
