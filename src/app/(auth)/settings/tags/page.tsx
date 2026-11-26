"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Tag, Button, Modal, Form, Input, Select, Skeleton, Space, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { useState } from "react";

const COLOR_OPTIONS = [
  { value: "magenta", label: "Маджента" },
  { value: "red", label: "Красный" },
  { value: "volcano", label: "Вулканический" },
  { value: "orange", label: "Оранжевый" },
  { value: "gold", label: "Золотой" },
  { value: "lime", label: "Лаймовый" },
  { value: "green", label: "Зелёный" },
  { value: "cyan", label: "Голубой" },
  { value: "blue", label: "Синий" },
  { value: "geekblue", label: "Гик-синий" },
  { value: "purple", label: "Фиолетовый" },
];

interface TagItem {
  id: string;
  name: string;
  color?: string;
  category?: string;
  count: number;
}

export default function TagsPage() {
  usePageTitle("Теги · Настройки");
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.tags.list(),
    queryFn: () => appApi.getTags(),
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; color?: string; category?: string }) => appApi.createTag(payload),
    onSuccess: () => {
      message.success("Тег создан");
      qc.invalidateQueries({ queryKey: qk.tags.list() });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать тег"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => appApi.deleteTag(id),
    onSuccess: () => {
      message.success("Тег удалён");
      qc.invalidateQueries({ queryKey: qk.tags.list() });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const columns: ColumnsType<TagItem> = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      render: (v: string, r) => <Tag color={r.color || "default"}>{v}</Tag>,
    },
    { title: "Категория", dataIndex: "category", key: "category", render: (v?: string) => v || "—" },
    { title: "Использований", dataIndex: "count", key: "count", width: 120 },
    {
      title: "Действия",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <Popconfirm title="Удалить тег?" onConfirm={() => deleteMut.mutate(r.id)}>
          <Button size="small" type="link" danger>Удалить</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Теги">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Теги кандидатов</h3>
        <Button type="primary" onClick={() => { form.resetFields(); setCreateOpen(true); }}>
          Создать тег
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table<TagItem>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          locale={{ emptyText: "Нет тегов" }}
        />
      )}

      <Modal
        title="Создать тег"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMut.mutate(v)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: VIP-кандидат" />
          </Form.Item>
          <Form.Item label="Цвет" name="color">
            <Select options={COLOR_OPTIONS} placeholder="Выберите цвет" />
          </Form.Item>
          <Form.Item label="Категория" name="category">
            <Input placeholder="Например: Источник" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>Создать</Button>
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
