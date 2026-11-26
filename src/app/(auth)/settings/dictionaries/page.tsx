"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Table, Button, Modal, Form, Input, message, Tag, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

interface Dictionary {
  id: string;
  name: string;
  code: string;
}

export default function DictionariesSettingsPage() {
  const qc = useQueryClient();
  usePageTitle("Справочники");
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.dictionaries.list(),
    queryFn: () => appApi.getReferenceDictionaryList(),
  });

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.createReferenceDictionary(payload),
    onSuccess: () => {
      message.success("Справочник создан");
      qc.invalidateQueries({ queryKey: qk.dictionaries.list() });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать"),
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => appApi.archiveReferenceDictionary(id),
    onSuccess: () => {
      message.success("Архивирован");
      qc.invalidateQueries({ queryKey: qk.dictionaries.list() });
    },
    onError: () => message.error("Не удалось архивировать"),
  });

  const items = (data as { items?: Dictionary[] })?.items ?? [];

  const columns: ColumnsType<Dictionary> = [
    { title: "Название", dataIndex: "name", key: "name" },
    { title: "Код", dataIndex: "code", key: "code", render: (v: string) => <Tag>{v}</Tag> },
    {
      title: "Действия",
      key: "actions",
      render: (_, r) => (
        <Popconfirm title="Архивировать?" onConfirm={() => archiveMut.mutate(r.id)}>
          <Button type="text" size="small" danger>Архивировать</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Справочники">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Справочники</h2>
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Создать справочник
            </Button>
          </div>
          <Table<Dictionary>
            columns={columns}
            dataSource={items}
            rowKey="id"
            locale={{ emptyText: "Нет справочников" }}
          />
        </>
      )}
      <Modal
        title="Новый справочник"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.validateFields().then((values) => createMut.mutate(values))}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createMut.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Название справочника" />
          </Form.Item>
          <Form.Item label="Код" name="code" rules={[{ required: true, message: "Введите код" }]}>
            <Input placeholder="Например: regions" />
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
