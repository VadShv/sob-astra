"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, Button, Tag, Skeleton } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { authApi } from "@/lib/api";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

const columns: ColumnsType<UserRow> = [
  {
    title: "Имя",
    dataIndex: "name",
    key: "name",
    render: (name: string) => name || "—",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
  },
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
];

export default function UsersSettingsPage() {
  return (
    <SettingsLayout activeItem="Пользователи">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Пользователи</h3>
        <Button type="primary">Пригласить</Button>
      </div>
      <Table<UserRow>
        columns={columns}
        dataSource={[]}
        rowKey="id"
        pagination={false}
        size="middle"
        locale={{ emptyText: "Нет пользователей" }}
      />
    </SettingsLayout>
  );
}
