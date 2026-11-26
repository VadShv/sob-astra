"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, Form, Input, Button, message } from "antd";
import { usePageTitle } from "@/components/usePageTitle";
import { appApi } from "@/lib/api";
import s from "./reset-password.module.css";

export default function ResetPasswordPage() {
  usePageTitle("Сброс пароля · Собесо");
  const [sent, setSent] = useState(false);
  const [form] = Form.useForm();

  const resetMut = useMutation({
    mutationFn: (email: string) => appApi.requestPasswordReset(email),
    onSuccess: () => {
      message.success("Инструкции отправлены на почту");
      setSent(true);
    },
    onError: () => message.error("Не удалось отправить"),
  });

  return (
    <div className={s.page}>
      <Card style={{ maxWidth: 400, margin: "0 auto" }}>
        <h1 style={{ textAlign: "center" }}>Сброс пароля</h1>

        {sent ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <p>Мы отправили инструкции по сбросу пароля на вашу почту.</p>
            <Button type="primary" href="/login" style={{ marginTop: 16 }}>Вернуться к входу</Button>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => resetMut.mutate(values.email)}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: "email", message: "Введите email" }]}
            >
              <Input placeholder="example@mail.ru" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" loading={resetMut.isPending} style={{ width: "100%" }}>
                Отправить инструкции
              </Button>
            </Form.Item>
            <div style={{ textAlign: "center" }}>
              <a href="/login">← Вернуться к входу</a>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
