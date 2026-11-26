"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Skeleton, Tag, Form, Input, Button, message } from "antd";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./job-detail.module.css";

export default function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  usePageTitle("Вакансия · Собесо");
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);

  const { data: vacancy, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-vacancy", id],
    queryFn: () => appApi.getPublicVacancyById(id),
  });

  const applyMut = useMutation({
    mutationFn: (payload: Parameters<typeof appApi.submitApplication>[1]) =>
      appApi.submitApplication(id, payload),
    onSuccess: () => {
      message.success("Отклик отправлен!");
      setSubmitted(true);
    },
    onError: () => message.error("Не удалось отправить отклик"),
  });

  if (isError) {
    return (
      <div className={s.page}>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !vacancy) {
    return (
      <div className={s.page}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className={s.page}>
      <Card>
        <h1>{vacancy.title}</h1>
        <div className={s.meta}>
          {vacancy.city && <Tag>{vacancy.city}</Tag>}
          {vacancy.employmentType && <Tag>{vacancy.employmentType}</Tag>}
          {vacancy.experience && <Tag>{vacancy.experience}</Tag>}
          {(vacancy.salaryFrom || vacancy.salaryTo) && (
            <Tag color="green">{vacancy.salaryFrom ?? "—"}–{vacancy.salaryTo ?? "—"} ₽</Tag>
          )}
        </div>
        <div className={s.company}>
          <strong>{vacancy.company.name}</strong>
          {vacancy.company.description && <p>{vacancy.company.description}</p>}
        </div>
        {vacancy.description && (
          <div className={s.description}>
            <h3>Описание</h3>
            <div style={{ whiteSpace: "pre-wrap" }}>{vacancy.description}</div>
          </div>
        )}
      </Card>

      <Card title="Откликнуться" style={{ marginTop: 16 }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <h3>Спасибо за отклик!</h3>
            <p style={{ color: "rgba(0,0,0,.45)" }}>Мы свяжемся с вами в ближайшее время.</p>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={(v) => applyMut.mutate(v)}>
            <Form.Item label="Имя" name="firstName" rules={[{ required: true, message: "Введите имя" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Фамилия" name="lastName" rules={[{ required: true, message: "Введите фамилию" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Введите email" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Телефон" name="phone">
              <Input />
            </Form.Item>
            <Form.Item label="Сопроводительное письмо" name="coverLetter">
              <Input.TextArea rows={5} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={applyMut.isPending} size="large">
                Отправить отклик
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}
