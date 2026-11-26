"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Table, Button, Modal, Form, Input, message, Tag, Popconfirm, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

const { Text } = Typography;

interface ApiToken {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

interface Webhook {
  id: string;
  url: string;
  event: string;
  createdAt: string;
}

export default function ApiSettingsPage() {
  const qc = useQueryClient();
  usePageTitle("Внешний API");
  const [tokenOpen, setTokenOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data: tokensData, isLoading: tokensLoading, isError: tokensError, refetch: refetchTokens } = useQuery({
    queryKey: qk.externalApi.tokens(),
    queryFn: () => appApi.getExternalApiTokens(),
  });

  const { data: hooksData, isLoading: hooksLoading } = useQuery({
    queryKey: qk.externalApi.hooks(),
    queryFn: () => appApi.getExternalApiHooks(),
  });

  const createTokenMut = useMutation({
    mutationFn: (payload: { name: string }) => appApi.createExternalApiToken(payload),
    onSuccess: (resp) => {
      message.success("Токен создан");
      setNewToken(resp.token);
      qc.invalidateQueries({ queryKey: qk.externalApi.tokens() });
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать токен"),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => appApi.revokeExternalApiToken(id),
    onSuccess: () => {
      message.success("Токен отозван");
      qc.invalidateQueries({ queryKey: qk.externalApi.tokens() });
    },
    onError: () => message.error("Не удалось отозвать"),
  });

  const deleteHookMut = useMutation({
    mutationFn: (id: string) => appApi.deleteExternalApiHook(id),
    onSuccess: () => {
      message.success("Webhook удалён");
      qc.invalidateQueries({ queryKey: qk.externalApi.hooks() });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const tokens = (tokensData as { items?: ApiToken[] })?.items ?? [];
  const hooks = (hooksData as { items?: Webhook[] })?.items ?? [];

  const tokenColumns: ColumnsType<ApiToken> = [
    { title: "Название", dataIndex: "name", key: "name" },
    { title: "Создан", dataIndex: "createdAt", key: "createdAt", render: (v: string) => new Date(v).toLocaleDateString("ru-RU") },
    { title: "Последнее использование", dataIndex: "lastUsedAt", key: "lastUsedAt", render: (v: string) => v ? new Date(v).toLocaleDateString("ru-RU") : "—" },
    {
      title: "Действия",
      key: "actions",
      render: (_, r) => (
        <Popconfirm title="Отозвать токен?" onConfirm={() => revokeMut.mutate(r.id)}>
          <Button type="text" size="small" danger>Отозвать</Button>
        </Popconfirm>
      ),
    },
  ];

  const hookColumns: ColumnsType<Webhook> = [
    { title: "URL", dataIndex: "url", key: "url", ellipsis: true },
    { title: "Событие", dataIndex: "event", key: "event", render: (v: string) => <Tag>{v}</Tag> },
    { title: "Создан", dataIndex: "createdAt", key: "createdAt", render: (v: string) => new Date(v).toLocaleDateString("ru-RU") },
    {
      title: "Действия",
      key: "actions",
      render: (_, r) => (
        <Popconfirm title="Удалить webhook?" onConfirm={() => deleteHookMut.mutate(r.id)}>
          <Button type="text" size="small" danger>Удалить</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Внешний API">
      {tokensError ? (
        <ErrorState onRetry={() => refetchTokens()} />
      ) : tokensLoading ? (
        <Skeleton active />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>API-токены</h2>
            <Button type="primary" onClick={() => { setNewToken(null); setTokenOpen(true); }}>
              Создать токен
            </Button>
          </div>
          <Table<ApiToken>
            columns={tokenColumns}
            dataSource={tokens}
            rowKey="id"
            locale={{ emptyText: "Нет токенов" }}
            style={{ marginBottom: 32 }}
          />

          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Webhooks</h2>
          {hooksLoading ? (
            <Skeleton active />
          ) : (
            <Table<Webhook>
              columns={hookColumns}
              dataSource={hooks}
              rowKey="id"
              locale={{ emptyText: "Нет webhooks" }}
            />
          )}
        </>
      )}
      <Modal
        title="Новый API-токен"
        open={tokenOpen}
        onCancel={() => setTokenOpen(false)}
        footer={newToken ? (
          <Button type="primary" onClick={() => setTokenOpen(false)}>Готово</Button>
        ) : undefined}
        onOk={newToken ? undefined : () => form.validateFields().then((values) => createTokenMut.mutate(values))}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createTokenMut.isPending}
      >
        {newToken ? (
          <div>
            <Text strong>Сохраните токен, он больше не будет показан:</Text>
            <Input.TextArea value={newToken} readOnly style={{ marginTop: 8 }} autoSize />
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
              <Input placeholder="Например: Integration token" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </SettingsLayout>
  );
}
