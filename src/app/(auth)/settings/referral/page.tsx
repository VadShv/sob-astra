"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Form, Input, Switch, Button, Skeleton, Descriptions, message } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import { useState } from "react";

export default function ReferralPage() {
  usePageTitle("Реферальная программа · Настройки");
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["referral-program"],
    queryFn: () => appApi.getReferralProgram(),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { enabled: boolean; bonusAmount?: number; conditions?: string }) =>
      appApi.updateReferralProgram(payload),
    onSuccess: () => {
      message.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["referral-program"] });
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  return (
    <SettingsLayout activeItem="Реферальная программа">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <Card title="Текущее состояние" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Включена">{data?.enabled ? "Да" : "Нет"}</Descriptions.Item>
              <Descriptions.Item label="Бонус">{data?.bonusAmount?.toLocaleString("ru-RU")} {data?.currency ?? "₽"}</Descriptions.Item>
              <Descriptions.Item label="Рефералов">{data?.referralsCount}</Descriptions.Item>
              <Descriptions.Item label="Условия">{data?.conditions || "—"}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Настройки">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                enabled: data?.enabled,
                bonusAmount: data?.bonusAmount,
                conditions: data?.conditions,
              }}
              onFinish={(v) => updateMut.mutate(v)}
            >
              <Form.Item label="Включена" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="Бонус (₽)" name="bonusAmount">
                <Input type="number" min={0} />
              </Form.Item>
              <Form.Item label="Условия" name="conditions">
                <Input.TextArea rows={3} placeholder="Условия получения бонуса" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={updateMut.isPending}>Сохранить</Button>
              </Form.Item>
            </Form>
          </Card>
        </>
      )}
    </SettingsLayout>
  );
}
