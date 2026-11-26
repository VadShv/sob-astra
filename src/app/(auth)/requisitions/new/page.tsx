"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Form, Input, Button, Card, Select, message } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "@/components/usePageTitle";

export default function NewRequisitionPage() {
  const router = useRouter();
  const qc = useQueryClient();
  usePageTitle("Новая заявка");
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.createRequisition(payload),
    onSuccess: (resp) => {
      message.success("Заявка создана");
      qc.invalidateQueries({ queryKey: qk.requisitions.all() });
      qc.invalidateQueries({ queryKey: qk.requisitions.summary() });
      router.push(`/requisitions/${resp.id}`);
    },
    onError: () => {
      message.error("Не удалось создать заявку");
      setSaving(false);
    },
  });

  return (
    <div>
      <PageHeader title="Новая заявка на найм" />
      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          requiredMark
          onFinish={(values) => {
            setSaving(true);
            createMut.mutate(values);
          }}
        >
          <Form.Item label="Должность" name="title" rules={[{ required: true, message: "Введите должность" }]}>
            <Input placeholder="Например: Frontend разработчик" size="large" />
          </Form.Item>
          <Form.Item label="Отдел" name="department">
            <Input placeholder="Отдел" />
          </Form.Item>
          <Form.Item label="Позиция" name="position">
            <Input placeholder="Позиция" />
          </Form.Item>
          <Form.Item label="Планируем найм" name="plannedHires" initialValue={1} rules={[{ required: true, message: "Введите количество" }, { type: "number", min: 1, message: "Минимум 1" }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item label="Зарплата от" name="salaryFrom">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item label="Зарплата до" name="salaryTo">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item label="Обоснование" name="justification" rules={[{ max: 2000, message: "Не более 2000 символов" }]}>
            <Input.TextArea rows={4} placeholder="Почему нужна эта вакансия" showCount maxLength={2000} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Создать заявку
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
