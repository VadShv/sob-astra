"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Skeleton, Tag, Button, message, Empty, Popconfirm, Radio, Space } from "antd";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./interview.module.css";

export default function InterviewSlotPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  usePageTitle("Выбор времени интервью · Собесо");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["interview-slots", token],
    queryFn: () => appApi.getInterviewSlots(token),
  });

  const bookMut = useMutation({
    mutationFn: (slotId: string) => appApi.bookInterviewSlot(token, slotId),
    onSuccess: () => {
      message.success("Время забронировано!");
      setBooked(true);
    },
    onError: () => message.error("Не удалось забронировать"),
  });

  const cancelMut = useMutation({
    mutationFn: () => appApi.cancelInterviewByCandidate(token),
    onSuccess: () => {
      message.success("Интервью отменено");
      refetch();
    },
    onError: () => message.error("Не удалось отменить"),
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

  if (booked) {
    return (
      <div className={s.page}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <h2>✓ Интервью запланировано</h2>
          <p style={{ color: "rgba(0,0,0,.45)" }}>
            Мы отправили подтверждение на вашу почту. До встречи!
          </p>
          <Button type="primary" href={`/portal/${token}`} style={{ marginTop: 16 }}>
            Вернуться в кабинет
          </Button>
        </Card>
      </div>
    );
  }

  const availableSlots = data.slots.filter((s) => s.available);
  const groupedByDay: Record<string, typeof availableSlots> = {};
  availableSlots.forEach((slot) => {
    const day = new Date(slot.start).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(slot);
  });

  return (
    <div className={s.page}>
      <Card>
        <h1>Выберите время интервью</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
          <Tag color="purple">{data.interview.type}</Tag>
          <Tag>{data.interview.format}</Tag>
          <Tag>{data.interview.durationMin} мин</Tag>
        </div>
        <p style={{ color: "rgba(0,0,0,.65)" }}>
          <strong>{data.interview.vacancyTitle}</strong> · {data.interview.companyName}
        </p>
        <p style={{ color: "rgba(0,0,0,.45)", fontSize: 13 }}>
          Интервьюеры: {data.interview.interviewerNames.join(", ")}
        </p>
      </Card>

      <Card title="Доступные слоты" style={{ marginTop: 16 }}>
        {availableSlots.length === 0 ? (
          <Empty description="Нет доступных слотов" />
        ) : (
          <>
            {Object.entries(groupedByDay).map(([day, slots]) => (
              <div key={day} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, textTransform: "capitalize" }}>{day}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {slots.map((slot) => (
                    <Button
                      key={slot.id}
                      type={selectedSlot === slot.id ? "primary" : "default"}
                      onClick={() => setSelectedSlot(slot.id)}
                    >
                      {new Date(slot.start).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <Button
                type="primary"
                size="large"
                disabled={!selectedSlot}
                loading={bookMut.isPending}
                onClick={() => selectedSlot && bookMut.mutate(selectedSlot)}
              >
                Подтвердить время
              </Button>
              <Popconfirm title="Отменить интервью?" onConfirm={() => cancelMut.mutate()}>
                <Button danger>Отменить</Button>
              </Popconfirm>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
