"use client";

import { useEffect, useState } from "react";
import { Form, Switch, Button, Divider, message, Skeleton } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";

const FALLBACK_NOTIFICATION_KEYS = [
  { key: "newCandidate", title: "Новый кандидат", desc: "Когда кандидат откликается на вакансию" },
  { key: "aiInterview", title: "Интервью ИИ завершено", desc: "Когда ИИ заканчивает интервью с кандидатом" },
  { key: "candidateReply", title: "Ответ кандидата", desc: "Когда кандидат отвечает на сообщение" },
  { key: "dailyDigest", title: "Ежедневный дайджест", desc: "Сводка за день каждое утро" },
];

export default function NotificationsSettingsPage() {
  usePageTitle("Уведомления · Настройки");
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: qk.notifications.settings(),
    queryFn: () => appApi.getNotificationSettings(),
  });

  const { data: typesData } = useQuery({
    queryKey: qk.notifications.types(),
    queryFn: () => appApi.getNotificationTypes(),
    staleTime: 300_000,
  });

  const NOTIFICATION_KEYS = ((typesData as { items?: Array<{ code: string; name: string; description: string }> })?.items ?? []).length > 0
    ? ((typesData as { items?: Array<{ code: string; name: string; description: string }> })?.items ?? []).map((t) => ({ key: t.code, title: t.name, desc: t.description }))
    : FALLBACK_NOTIFICATION_KEYS;

  const mutation = useMutation({
    mutationFn: (values: Record<string, boolean>) => appApi.updateNotificationSettings(values),
    onSuccess: () => {
      message.success("Сохранено");
      qc.invalidateQueries({ queryKey: qk.notifications.settings() });
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  useEffect(() => {
    if (settings) form.setFieldsValue(settings);
  }, [settings, form]);

  return (
    <SettingsLayout activeItem="Уведомления">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 480 }}
          onFinish={(values) => mutation.mutate(values)}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Email-уведомления
          </div>
          {NOTIFICATION_KEYS.map((item, i) => (
            <div key={item.key}>
              <Form.Item name={item.key} valuePropName="checked">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>{item.desc}</div>
                  </div>
                  <Switch />
                </div>
              </Form.Item>
              {i < NOTIFICATION_KEYS.length - 1 && <Divider />}
            </div>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              Сохранить
            </Button>
          </Form.Item>
        </Form>
      )}

      <Divider />

      <NotificationTypeMatrix />
    </SettingsLayout>
  );
}

function NotificationTypeMatrix() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notification-type-settings"],
    queryFn: () => appApi.getNotificationTypeSettings(),
  });

  const [rows, setRows] = useState<Array<{ type: string; label: string; emailEnabled: boolean; pushEnabled: boolean }>>([]);

  useEffect(() => {
    if (data) setRows((data as { items: Array<{ type: string; label: string; emailEnabled: boolean; pushEnabled: boolean }> }).items);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (payload: Array<{ type: string; emailEnabled: boolean; pushEnabled: boolean }>) =>
      appApi.updateNotificationTypeSettings(payload),
    onSuccess: () => {
      message.success("Настройки каналов сохранены");
      qc.invalidateQueries({ queryKey: ["notification-type-settings"] });
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  if (isLoading) return <Skeleton active />;

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Каналы уведомлений по типам</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>Тип</th>
            <th style={{ textAlign: "center", padding: "8px 0" }}>Email</th>
            <th style={{ textAlign: "center", padding: "8px 0" }}>Push</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.type} style={{ borderTop: "1px solid #f0f0f0" }}>
              <td style={{ padding: "8px 0" }}>{r.label}</td>
              <td style={{ textAlign: "center", padding: "8px 0" }}>
                <Switch
                  checked={r.emailEnabled}
                  onChange={(v) => setRows((prev) => prev.map((p, j) => j === i ? { ...p, emailEnabled: v } : p))}
                />
              </td>
              <td style={{ textAlign: "center", padding: "8px 0" }}>
                <Switch
                  checked={r.pushEnabled}
                  onChange={(v) => setRows((prev) => prev.map((p, j) => j === i ? { ...p, pushEnabled: v } : p))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        type="primary"
        style={{ marginTop: 16 }}
        loading={saveMut.isPending}
        onClick={() => saveMut.mutate(rows.map((r) => ({ type: r.type, emailEnabled: r.emailEnabled, pushEnabled: r.pushEnabled })))}
      >
        Сохранить каналы
      </Button>
    </div>
  );
}
