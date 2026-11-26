"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, Skeleton, message, Popconfirm } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

export default function OfferTemplatesPage() {
  usePageTitle("Шаблоны офферов · Настройки");
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["offer-templates"],
    queryFn: () => appApi.getOfferTemplates(),
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; subject?: string; body: string }) =>
      appApi.createOfferTemplate(payload),
    onSuccess: () => {
      message.success("Шаблон создан");
      qc.invalidateQueries({ queryKey: ["offer-templates"] });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать шаблон"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => appApi.deleteOfferTemplate(id),
    onSuccess: () => {
      message.success("Шаблон удалён");
      qc.invalidateQueries({ queryKey: ["offer-templates"] });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  return (
    <SettingsLayout activeItem="Шаблоны офферов">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Шаблоны оффер-писем</h3>
        <Button type="primary" onClick={() => { form.resetFields(); setCreateOpen(true); }}>
          Создать шаблон
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          dataSource={data?.items ?? []}
          rowKey="id"
          locale={{ emptyText: "Нет шаблонов" }}
          columns={[
            { title: "Название", dataIndex: "name", key: "name" },
            { title: "Тема", dataIndex: "subject", key: "subject", render: (v?: string) => v || "—" },
            {
              title: "Действия",
              key: "actions",
              width: 80,
              render: (_, r) => (
                <Popconfirm title="Удалить шаблон?" onConfirm={() => deleteMut.mutate(r.id)}>
                  <Button size="small" type="link" danger>Удалить</Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      )}

      <Modal title="Создать шаблон оффера" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={(v) => createMut.mutate(v)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Стандартный оффер" />
          </Form.Item>
          <Form.Item label="Тема письма" name="subject">
            <Input placeholder="Оффер от {company}" />
          </Form.Item>
          <Form.Item label="Текст" name="body" rules={[{ required: true, message: "Введите текст" }]}>
            <Input.TextArea rows={8} placeholder=": {candidateName}..." showCount maxLength={5000} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>Создать</Button>
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
