"use client";

import { useEffect } from "react";
import { Form, Switch, Button, Divider, message, Skeleton } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";

const NOTIFICATION_KEYS = [
  { key: "newCandidate", title: "Новый кандидат", desc: "Когда кандидат откликается на вакансию" },
  { key: "aiInterview", title: "Интервью ИИ завершено", desc: "Когда ИИ заканчивает интервью с кандидатом" },
  { key: "candidateReply", title: "Ответ кандидата", desc: "Когда кандидат отвечает на сообщение" },
  { key: "dailyDigest", title: "Ежедневный дайджест", desc: "Сводка за день каждое утро" },
];

export default function NotificationsSettingsPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => appApi.getNotificationSettings(),
  });

  const mutation = useMutation({
    mutationFn: (values: Record<string, boolean>) => appApi.updateNotificationSettings(values),
    onSuccess: () => {
      message.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["notification-settings"] });
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  useEffect(() => {
    if (settings) form.setFieldsValue(settings);
  }, [settings, form]);

  return (
    <SettingsLayout activeItem="Уведомления">
      {isLoading ? (
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
    </SettingsLayout>
  );
}
