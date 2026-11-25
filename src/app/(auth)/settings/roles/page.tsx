"use client";

import { Table, Tag, Button, Modal, Form, Input, Select, Checkbox, Space, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const PERMISSIONS = [
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
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: rolesResp } = useQuery({
    queryKey: ["company-roles"],
    queryFn: () => appApi.getCompanyRoles(),
  });

  const roles = ((rolesResp as { items?: Role[] })?.items ?? []) as Role[];

  const columns: ColumnsType<Role> = [
    { title: "Роль", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
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
      render: () => (
        <Button type="text" size="small" onClick={() => message.info("Редактирование — в разработке")}>
          Изменить
        </Button>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Роли и права">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Роли и права доступа</div>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Создать роль
        </Button>
      </div>
      <Table<Role>
        columns={columns}
        dataSource={roles}
        rowKey="id"
        pagination={false}
        size="middle"
      />
      <Modal
        title="Новая роль"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          form.validateFields().then(() => {
            message.success("Роль создана");
            setCreateOpen(false);
          });
        }}
        okText="Создать"
        cancelText="Отмена"
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
