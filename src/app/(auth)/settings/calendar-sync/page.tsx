"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Tag, Skeleton, Space, message, Popconfirm, Input } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import { useState } from "react";

export default function CalendarSyncPage() {
  usePageTitle("Синхронизация календарей · Настройки");
  const qc = useQueryClient();
  const [googleCode, setGoogleCode] = useState("");
  const [outlookCode, setOutlookCode] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar-sync"],
    queryFn: () => appApi.getCalendarSyncStatus(),
  });

  const googleMut = useMutation({
    mutationFn: (code: string) => appApi.connectGoogleCalendar({ code }),
    onSuccess: () => {
      message.success("Google Calendar подключён");
      qc.invalidateQueries({ queryKey: ["calendar-sync"] });
      setGoogleCode("");
    },
    onError: () => message.error("Не удалось подключить"),
  });

  const outlookMut = useMutation({
    mutationFn: (code: string) => appApi.connectOutlookCalendar({ code }),
    onSuccess: () => {
      message.success("Outlook Calendar подключён");
      qc.invalidateQueries({ queryKey: ["calendar-sync"] });
      setOutlookCode("");
    },
    onError: () => message.error("Не удалось подключить"),
  });

  const disconnectMut = useMutation({
    mutationFn: (type: string) => appApi.disconnectCalendar(type),
    onSuccess: () => {
      message.success("Отключено");
      qc.invalidateQueries({ queryKey: ["calendar-sync"] });
    },
    onError: () => message.error("Не удалось отключить"),
  });

  return (
    <SettingsLayout activeItem="Синхронизация календарей">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card title="Google Calendar">
            {data?.google?.connected ? (
              <Space>
                <Tag color="green">Подключён</Tag>
                <span>{data.google.email}</span>
                <Popconfirm title="Отключить?" onConfirm={() => disconnectMut.mutate("google")}>
                  <Button danger>Отключить</Button>
                </Popconfirm>
              </Space>
            ) : (
              <Space>
                <Input
                  placeholder="OAuth code"
                  value={googleCode}
                  onChange={(e) => setGoogleCode(e.target.value)}
                  style={{ width: 300 }}
                />
                <Button type="primary" disabled={!googleCode} loading={googleMut.isPending} onClick={() => googleMut.mutate(googleCode)}>
                  Подключить
                </Button>
              </Space>
            )}
          </Card>

          <Card title="Outlook Calendar">
            {data?.outlook?.connected ? (
              <Space>
                <Tag color="green">Подключён</Tag>
                <span>{data.outlook.email}</span>
                <Popconfirm title="Отключить?" onConfirm={() => disconnectMut.mutate("outlook")}>
                  <Button danger>Отключить</Button>
                </Popconfirm>
              </Space>
            ) : (
              <Space>
                <Input
                  placeholder="OAuth code"
                  value={outlookCode}
                  onChange={(e) => setOutlookCode(e.target.value)}
                  style={{ width: 300 }}
                />
                <Button type="primary" disabled={!outlookCode} loading={outlookMut.isPending} onClick={() => outlookMut.mutate(outlookCode)}>
                  Подключить
                </Button>
              </Space>
            )}
          </Card>
        </Space>
      )}
    </SettingsLayout>
  );
}
