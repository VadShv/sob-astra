"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Table, Tag, Modal, Form, Input, Select, Space, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  channel: string;
  body: string;
  variables: string[];
}

export default function TemplatesSettingsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: templatesResp } = useQuery({
    queryKey: ["message-templates"],
    queryFn: () => appApi.getMessageTemplates(),
  });

  const { data: varsResp } = useQuery({
    queryKey: ["message-template-variables"],
    queryFn: () => appApi.getMessageTemplates(),
  });

  const templates = ((templatesResp as { items?: Template[] })?.items ?? []) as Template[];
  const variables = ((varsResp as { variables?: string[] })?.variables ?? []) as string[];

  const columns: ColumnsType<Template> = [
    { title: "Название", dataIndex: "name", key: "name", render: (n: string) => <strong>{n}</strong> },
    {
      title: "Канал",
      dataIndex: "channel",
      key: "channel",
      render: (ch: string) => (ch ? <Tag>{ch}</Tag> : "—"),
    },
    { title: "Текст", dataIndex: "body", key: "body", ellipsis: true },
    {
      title: "",
      key: "actions",
      render: () => (
        <Space>
          <Button type="text" size="small" onClick={() => message.info("Редактирование — в разработке")}>
            Изменить
          </Button>
          <Button type="text" size="small" danger onClick={() => message.info("Удаление — в разработке")}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <SettingsLayout activeItem="Шаблоны сообщений">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Шаблоны сообщений</div>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Создать шаблон
        </Button>
      </div>
      <Table<Template>
        columns={columns}
        dataSource={templates}
        rowKey="id"
        pagination={false}
        size="middle"
      />
      <Modal
        title="Новый шаблон"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          form.validateFields().then(() => {
            message.success("Шаблон создан");
            setCreateOpen(false);
          });
        }}
        okText="Создать"
        cancelText="Отмена"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="name" rules={[{ required: true }]}>
            <Input placeholder="Например: Приглашение на интервью" />
          </Form.Item>
          <Form.Item label="Канал" name="channel">
            <Select
              options={[
                { value: "email", label: "Email" },
                { value: "telegram", label: "Telegram" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "sms", label: "SMS" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Текст сообщения" name="body" rules={[{ required: true }]}>
            <Input.TextArea
              rows={5}
              placeholder="Введите текст. Используйте переменные вида {{имя}}"
            />
          </Form.Item>
          {variables.length > 0 && (
            <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
              Доступные переменные: {variables.map((v) => `{{${v}}}`).join(", ")}
            </div>
          )}
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
