"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Form, Input, Select, Button, Card, Space, Checkbox, message } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi } from "@/lib/api";

export default function VacancyCreatePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const { data: orgUnits } = useQuery({
    queryKey: ["org-units"],
    queryFn: () => appApi.getOrgUnits(),
  });

  const { data: facets } = useQuery({
    queryKey: ["vacancy-facets"],
    queryFn: () => appApi.getVacancyFacets({ status: "active,paused,distribution" }),
  });

  const orgUnitItems = ((orgUnits as { items?: { id: string; name: string }[] })?.items ?? []);
  const recruiterItems = (facets?.recruiters ?? []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageHeader
        title="Новая вакансия"
        actions={
          <Space>
            <Button onClick={() => router.back()}>Отмена</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => {
                form.validateFields().then(() => {
                  setSaving(true);
                  message.info("Создание вакансии — в разработке");
                  setSaving(false);
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
          <Form.Item label="Название вакансии" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Frontend разработчик" size="large" />
          </Form.Item>
          <Form.Item label="Подразделение" name="orgUnitId">
            <Select
              options={orgUnitItems.map((u) => ({ value: u.id, label: u.name }))}
              placeholder="Выберите подразделение"
            />
          </Form.Item>
          <Form.Item label="Рекрутер" name="recruiterId">
            <Select
              options={recruiterItems.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Выберите рекрутера"
            />
          </Form.Item>
          <Form.Item label="Планируем найм" name="plannedHires" initialValue={1}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item label="Грейд" name="grade">
            <Select
              options={[
                { value: "junior", label: "Junior" },
                { value: "middle", label: "Middle" },
                { value: "senior", label: "Senior" },
                { value: "lead", label: "Lead" },
              ]}
              placeholder="Выберите грейд"
            />
          </Form.Item>
          <Form.Item label="Зарплата от" name="salaryFrom">
            <Input type="number" min={0} placeholder="₽" />
          </Form.Item>
          <Form.Item label="Зарплата до" name="salaryTo">
            <Input type="number" min={0} placeholder="₽" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={5} placeholder="Опишите вакансию" />
          </Form.Item>
          <Form.Item label="Конфиденциальная вакансия" name="isConfidential" valuePropName="checked">
            <Checkbox /> Скрыть название от кандидатов
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
