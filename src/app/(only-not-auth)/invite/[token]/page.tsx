"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, message, Card } from "antd";
import { authApi } from "@/lib/api";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { password: string }) => {
    setLoading(true);
    try {
      await authApi.acceptInvite(token, values.password);
      message.success("Пароль установлен");
      router.push("/home");
    } catch {
      message.error("Не удалось принять приглашение");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 24 }}>
      <Card style={{ maxWidth: 420, width: "100%" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Приглашение</h1>
        <p style={{ color: "rgba(0,0,0,.45)", marginBottom: 24 }}>Установите пароль для входа</p>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Пароль" name="password" rules={[{ required: true, message: "Введите пароль" }, { min: 8, message: "Минимум 8 символов" }]}>
            <Input.Password placeholder="Введите пароль" />
          </Form.Item>
          <Form.Item label="Повторите пароль" name="confirmPassword" dependencies={["password"]} rules={[{ required: true, message: "Повторите пароль" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("password") === value) return Promise.resolve(); return Promise.reject(new Error("Пароли не совпадают")); } })]}>
            <Input.Password placeholder="Повторите пароль" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Принять приглашение
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
