"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Table, Button, Modal, Form, Input, message, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

interface Team {
  id: string;
  name: string;
  parentId?: string;
  members?: Array<{ id: string; name: string }>;
}

export default function TeamsSettingsPage() {
  const qc = useQueryClient();
  usePageTitle("Команды");
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.teams.list(),
    queryFn: () => appApi.getTeams(),
  });

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.createReferenceDictionary(payload),
    onSuccess: () => {
      message.success("Команда создана");
      qc.invalidateQueries({ queryKey: qk.teams.list() });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать"),
  });

  const items = (data as { items?: Team[] })?.items ?? [];

  const columns: ColumnsType<Team> = [
    { title: "Название", dataIndex: "name", key: "name" },
    {
      title: "Участников",
      key: "members",
      render: (_, r) => r.members?.length ?? 0,
    },
    {
      title: "Состав",
      key: "memberList",
      render: (_, r) => (
        <span>
          {r.members?.slice(0, 3).map((m) => (
            <Tag key={m.id}>{m.name}</Tag>
          ))}
          {(r.members?.length ?? 0) > 3 && <Tag>+{(r.members!.length - 3)}</Tag>}
        </span>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Команды">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Команды</h2>
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Создать команду
            </Button>
          </div>
          <Table<Team>
            columns={columns}
            dataSource={items}
            rowKey="id"
            locale={{ emptyText: "Нет команд" }}
          />
        </>
      )}
      <Modal
        title="Новая команда"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.validateFields().then((values) => createMut.mutate(values))}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createMut.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Название команды" />
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
