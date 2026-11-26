"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Skeleton, Form, Input, DatePicker, Select, Upload, Button, message } from "antd";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./profile.module.css";

export default function ProfileFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  usePageTitle("Заполнение профиля · Собесо");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["profile-form", token],
    queryFn: () => appApi.getProfileForm(token),
  });

  const submitMut = useMutation({
    mutationFn: (formData: Record<string, string>) => appApi.submitProfileForm(token, formData),
    onSuccess: () => {
      message.success("Профиль сохранён!");
      setSubmitted(true);
    },
    onError: () => message.error("Не удалось сохранить"),
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

  if (submitted) {
    return (
      <div className={s.page}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <h2>✓ Профиль сохранён</h2>
          <p style={{ color: "rgba(0,0,0,.45)" }}>Спасибо за заполнение профиля!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <Card>
        <h1>Заполнение профиля</h1>
        <p style={{ color: "rgba(0,0,0,.45)" }}>
          {data.candidateName}{data.vacancyTitle ? `, вакансия: ${data.vacancyTitle}` : ""}
        </p>

        <Form
          layout="vertical"
          style={{ marginTop: 24 }}
          onFinish={(values) => {
            const strValues: Record<string, string> = {};
            for (const [k, v] of Object.entries(values)) {
              strValues[k] = typeof v === "string" ? v : v?.toString() ?? "";
            }
            submitMut.mutate(strValues);
          }}
        >
          {data.fields.map((field) => (
            <Form.Item
              key={field.key}
              label={field.label}
              name={field.key}
              rules={field.required ? [{ required: true, message: `Заполните: ${field.label}` }] : []}
              initialValue={field.value}
            >
              {field.type === "textarea" ? (
                <Input.TextArea rows={3} />
              ) : field.type === "select" ? (
                <Select options={field.options?.map((o) => ({ value: o, label: o }))} />
              ) : field.type === "date" ? (
                <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
              ) : field.type === "phone" ? (
                <Input placeholder="+7 (999) 123-45-67" />
              ) : (
                <Input type={field.type === "email" ? "email" : "text"} />
              )}
            </Form.Item>
          ))}

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={submitMut.isPending} style={{ width: "100%" }}>
              Сохранить профиль
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
