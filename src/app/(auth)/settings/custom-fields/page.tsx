"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Tag, Button, Modal, Form, Input, Select, Skeleton, Space, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

interface CustomField {
  id: string;
  name: string;
  type: string;
  entity: string;
  options?: string[];
  required: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  text: "Текст",
  number: "Число",
  select: "Список",
  multiselect: "Множественный выбор",
  date: "Дата",
  boolean: "Да/Нет",
};

export default function CustomFieldsPage() {
  usePageTitle("Кастомные поля · Настройки");
  const qc = useQueryClient();
  const [entityFilter, setEntityFilter] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.customFields.list(entityFilter),
    queryFn: () => appApi.getCustomFields(entityFilter),
  });

  const createMut = useMutation({
    mutationFn: (payload: Parameters<typeof appApi.createCustomField>[0]) => appApi.createCustomField(payload),
    onSuccess: () => {
      message.success("Поле создано");
      qc.invalidateQueries({ queryKey: qk.customFields.list() });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать поле"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => appApi.deleteCustomField(id),
    onSuccess: () => {
      message.success("Поле удалено");
      qc.invalidateQueries({ queryKey: qk.customFields.list() });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const columns: ColumnsType<CustomField> = [
    { title: "Название", dataIndex: "name", key: "name" },
    { title: "Тип", dataIndex: "type", key: "type", render: (v: string) => <Tag>{TYPE_LABELS[v] || v}</Tag> },
    { title: "Объект", dataIndex: "entity", key: "entity", render: (v: string) => <Tag>{v}</Tag> },
    { title: "Обязательное", dataIndex: "required", key: "required", render: (v: boolean) => v ? "Да" : "Нет" },
    {
      title: "Действия",
      key: "actions",
      width: 100,
      render: (_, r) => (
        <Popconfirm title="Удалить поле?" onConfirm={() => deleteMut.mutate(r.id)}>
          <Button size="small" type="link" danger>Удалить</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Кастомные поля">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Select
          placeholder="Все объекты"
          allowClear
          value={entityFilter}
          onChange={(v) => setEntityFilter(v)}
          style={{ width: 200 }}
          options={[
            { value: "vacancy", label: "Вакансия" },
            { value: "candidate", label: "Кандидат" },
            { value: "candidacy", label: "Кандидатура" },
          ]}
        />
        <Button type="primary" onClick={() => { form.resetFields(); setCreateOpen(true); }}>
          Создать поле
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table<CustomField>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          locale={{ emptyText: "Нет кастомных полей" }}
        />
      )}

      <Modal
        title="Создать кастомное поле"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMut.mutate(v)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Источник финансирования" />
          </Form.Item>
          <Form.Item label="Тип" name="type" rules={[{ required: true, message: "Выберите тип" }]}>
            <Select
              options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item label="Объект" name="entity" rules={[{ required: true, message: "Выберите объект" }]}>
            <Select
              options={[
                { value: "vacancy", label: "Вакансия" },
                { value: "candidate", label: "Кандидат" },
                { value: "candidacy", label: "Кандидатура" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Обязательное" name="required" valuePropName="checked">
            <Select options={[{ value: false, label: "Нет" }, { value: true, label: "Да" }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>Создать</Button>
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
