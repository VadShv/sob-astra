"use client";

import { Table, Tag, Button, Modal, Form, Input, Select, Checkbox, Space, message, Popconfirm, Skeleton } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const FALLBACK_PERMISSIONS = [
  { label: "Просмотр вакансий", value: "vacancy:read" },
  { label: "Создание вакансий", value: "vacancy:create" },
  { label: "Редактирование вакансий", value: "vacancy:update" },
  { label: "Удаление вакансий", value: "vacancy:delete" },
  { label: "Просмотр кандидатов", value: "candidate:read" },
  { label: "Добавление кандидатов", value: "candidate:create" },
  { label: "Управление настройками", value: "settings:manage" },
  { label: "Просмотр аналитики", value: "analytics:read" },
  { label: "Управление пользователями", value: "user:manage" },
];

export default function RolesSettingsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data: permissionsData } = useQuery({
    queryKey: qk.settings.permissions(),
    queryFn: () => appApi.getPermissions(),
    staleTime: 300_000,
  });

  const permissionOptions = ((permissionsData as { items?: Array<{ code: string; name: string }> })?.items ?? []).map((p) => ({ label: p.name, value: p.code }));
  const PERMISSIONS = permissionOptions.length > 0 ? permissionOptions : FALLBACK_PERMISSIONS;

  const { data: rolesResp, isLoading } = useQuery({
    queryKey: qk.settings.companyRoles(),
    queryFn: () => appApi.getCompanyRoles(),
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; description?: string; permissions: string[] }) =>
      appApi.createRole(payload),
    onSuccess: () => {
      message.success("Роль создана");
      qc.invalidateQueries({ queryKey: qk.settings.companyRoles() });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать роль"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => appApi.deleteRole(id),
    onSuccess: () => {
      message.success("Роль удалена");
      qc.invalidateQueries({ queryKey: qk.settings.companyRoles() });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      appApi.updateRole(id, payload),
    onSuccess: () => {
      message.success("Роль обновлена");
      qc.invalidateQueries({ queryKey: qk.settings.companyRoles() });
      setCreateOpen(false);
      setEditId(null);
      form.resetFields();
    },
    onError: () => message.error("Не удалось обновить"),
  });

  const roles = ((rolesResp as { items?: Role[] })?.items ?? []) as Role[];

  const columns: ColumnsType<Role> = [
    { title: "Роль", dataIndex: "name", key: "name", sorter: true, render: (name: string) => <strong>{name}</strong> },
    { title: "Описание", dataIndex: "description", key: "description" },
    {
      title: "Права",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: string[]) => (
        <Space size={4} wrap>
          {perms?.slice(0, 3).map((p) => <Tag key={p}>{p}</Tag>)}
          {perms?.length > 3 && <Tag>+{perms.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: "Пользователи",
      dataIndex: "userCount",
      key: "userCount",
      align: "center",
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" onClick={() => {
            form.setFieldsValue({ name: record.name, description: record.description, permissions: record.permissions });
            setEditId(record.id);
            setCreateOpen(true);
          }}>
            Изменить
          </Button>
          <Popconfirm title="Удалить роль?" onConfirm={() => deleteMut.mutate(record.id)}>
            <Button type="text" size="small" danger>Удалить</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Роли и права">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Роли и права доступа</div>
        <Button type="primary" onClick={() => { form.resetFields(); setEditId(null); setCreateOpen(true); }}>
          Создать роль
        </Button>
      </div>
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Table<Role>
          columns={columns}
          dataSource={roles}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: "Нет ролей" }}
        />
      )}
      <Modal
        title={editId ? "Редактировать роль" : "Новая роль"}
        open={createOpen}
        onCancel={() => { setCreateOpen(false); setEditId(null); }}
        onOk={() => {
          form.validateFields().then((values) => {
            if (editId) updateMut.mutate({ id: editId, payload: values });
            else createMut.mutate(values);
          });
        }}
        okText={editId ? "Сохранить" : "Создать"}
        cancelText="Отмена"
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название роли" name="name" rules={[{ required: true }]}>
            <Input placeholder="Например: Старший рекрутер" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Права" name="permissions">
            <Checkbox.Group options={PERMISSIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
