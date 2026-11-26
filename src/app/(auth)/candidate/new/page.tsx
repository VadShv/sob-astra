"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Select, Button, Card, Space, message } from "antd";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

function CandidateCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const backUrl = searchParams.get("back") || "/search";

  const { data: sources } = useQuery({
    queryKey: qk.candidates.sources(),
    queryFn: () => appApi.getReferenceDictionary("candidateSources"),
    staleTime: 300_000,
  });

  const sourceOptions = ((sources as { values?: { code: string; name: string }[] })?.values ?? []).map((s) => ({ value: s.code, label: s.name }));

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.createCandidate(payload),
    onSuccess: (resp) => {
      message.success("Кандидат создан");
      qc.invalidateQueries({ queryKey: qk.candidates.all() });
      router.push(`/candidate/${resp.id}`);
    },
    onError: () => {
      message.error("Не удалось создать кандидата");
      setSaving(false);
    },
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageHeader
        title="Новый кандидат"
        actions={
          <Space>
            <Button onClick={() => router.push(backUrl)}>Отмена</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => {
                form.validateFields().then((values) => {
                  setSaving(true);
                  createMut.mutate(values);
                });
              }}
            >
              Создать
            </Button>
          </Space>
        }
      />
      <Card>
        <Form form={form} layout="vertical" requiredMark>
          <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
            <Form.Item
              label="Фамилия"
              name="lastName"
              rules={[{ required: true, message: "Введите фамилию" }]}
              style={{ flex: 1, marginRight: 8 }}
            >
              <Input placeholder="Иванов" />
            </Form.Item>
            <Form.Item
              label="Имя"
              name="firstName"
              rules={[{ required: true, message: "Введите имя" }]}
              style={{ flex: 1, marginRight: 8 }}
            >
              <Input placeholder="Иван" />
            </Form.Item>
            <Form.Item label="Отчество" name="middleName" style={{ flex: 1 }}>
              <Input placeholder="Иванович" />
            </Form.Item>
          </Space.Compact>
          <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Некорректный email" }]}>
            <Input placeholder="example@mail.ru" />
          </Form.Item>
          <Form.Item label="Телефон" name="phone">
            <Input placeholder="+7 (999) 123-45-67" />
          </Form.Item>
          <Form.Item label="Должность" name="position">
            <Input placeholder="Например: Frontend разработчик" />
          </Form.Item>
          <Form.Item label="Компания" name="company">
            <Input placeholder="Текущее место работы" />
          </Form.Item>
          <Form.Item label="Зарплатные ожидания" name="salary">
            <Input type="number" min={0} placeholder="₽" />
          </Form.Item>
          <Form.Item label="Город" name="area">
            <Input placeholder="Например: Москва" />
          </Form.Item>
          <Form.Item label="Источник" name="source">
            <Select
              options={sourceOptions.length > 0 ? sourceOptions : [
                { value: "manual", label: "Добавлен вручную" },
                { value: "hh", label: "hh.ru" },
                { value: "referral", label: "Реферал" },
                { value: "avito", label: "Авито" },
              ]}
              placeholder="Выберите источник"
            />
          </Form.Item>
          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea rows={3} placeholder="Заметки о кандидате" />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default function CandidateCreatePage() {
  usePageTitle("Новый кандидат");
  return (
    <Suspense fallback={<div>Загрузка…</div>}>
      <CandidateCreateForm />
    </Suspense>
  );
}
