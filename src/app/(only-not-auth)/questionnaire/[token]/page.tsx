"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Skeleton, Form, Input, Select, Radio, Button, message, Rate } from "antd";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import s from "./questionnaire.module.css";

export default function QuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  usePageTitle("Анкета · Собесо");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["questionnaire", token],
    queryFn: () => appApi.getQuestionnaire(token),
  });

  const submitMut = useMutation({
    mutationFn: (answers: Record<string, unknown>) => appApi.submitQuestionnaire(token, answers),
    onSuccess: () => {
      message.success("Ответы отправлены!");
      setSubmitted(true);
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

  if (submitted) {
    return (
      <div className={s.page}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <h2>✓ Спасибо за ответы!</h2>
          <p style={{ color: "rgba(0,0,0,.45)" }}>Ваши ответы отправлены рекрутеру.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <Card>
        <h1>{data.title}</h1>
        {data.description && <p style={{ color: "rgba(0,0,0,.65)" }}>{data.description}</p>}

        <Form
          layout="vertical"
          style={{ marginTop: 24 }}
          onFinish={(values) => submitMut.mutate(values)}
        >
          {data.questions.map((q) => (
            <Form.Item
              key={q.id}
              label={q.text}
              name={q.id}
              rules={q.required ? [{ required: true, message: "Обязательный вопрос" }] : []}
            >
              {q.type === "textarea" ? (
                <Input.TextArea rows={3} />
              ) : q.type === "select" ? (
                <Select options={q.options?.map((o) => ({ value: o, label: o }))} />
              ) : q.type === "multiselect" ? (
                <Select mode="multiple" options={q.options?.map((o) => ({ value: o, label: o }))} />
              ) : q.type === "number" ? (
                <Input type="number" />
              ) : q.type === "boolean" ? (
                <Radio.Group>
                  <Radio value="yes">Да</Radio>
                  <Radio value="no">Нет</Radio>
                </Radio.Group>
              ) : q.type === "rating" ? (
                <Rate />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={submitMut.isPending} style={{ width: "100%" }}>
              Отправить ответы
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
