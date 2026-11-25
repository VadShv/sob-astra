"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Tag, Skeleton, Modal, Form, Input, Select, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastActiveAt?: string;
}

export default function UsersSettingsPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["company-users"],
    queryFn: () => appApi.getCompanyUsers(),
  });

  const inviteMut = useMutation({
    mutationFn: (payload: { email: string; role: string }) => appApi.inviteUser(payload),
    onSuccess: () => {
      message.success("Приглашение отправлено");
      qc.invalidateQueries({ queryKey: ["company-users"] });
      setInviteOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось пригласить"),
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => appApi.removeUser(userId),
    onSuccess: () => {
      message.success("Пользователь удалён");
      qc.invalidateQueries({ queryKey: ["company-users"] });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const users = data?.items ?? [];

  const columns: ColumnsType<UserRow> = [
    {
      title: "Имя",
      dataIndex: "name",
      key: "name",
      render: (name: string) => name || "—",
    },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Роль",
      dataIndex: "role",
      key: "role",
      render: (role: string) => <Tag>{role}</Tag>,
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Активен" : "Приглашён"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title="Удалить пользователя?"
          onConfirm={() => removeMut.mutate(record.id)}
        >
          <Button type="text" size="small" danger>Удалить</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Пользователи">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Пользователи</h3>
        <Button type="primary" onClick={() => setInviteOpen(true)}>
          Пригласить
        </Button>
      </div>
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Table<UserRow>
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: "Нет пользователей" }}
        />
      )}
      <Modal
        title="Пригласить пользователя"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => inviteMut.mutate(values));
        }}
        okText="Пригласить"
        cancelText="Отмена"
        confirmLoading={inviteMut.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Введите корректный email" }]}>
            <Input placeholder="colleague@company.ru" />
          </Form.Item>
          <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "ROLE_RECRUT", label: "Рекрутер" },
                { value: "ROLE_HR_ADMIN", label: "HR-администратор" },
                { value: "ROLE_ADMIN", label: "Администратор" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
