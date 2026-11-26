"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, Skeleton, message, Popconfirm } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";

export default function PipelinesPage() {
  usePageTitle("Воронки талантов · Настройки");
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pipelines"],
    queryFn: () => appApi.getPipelines(),
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => appApi.createPipeline(payload),
    onSuccess: () => {
      message.success("Воронка создана");
      qc.invalidateQueries({ queryKey: ["pipelines"] });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать"),
  });

  return (
    <SettingsLayout activeItem="Воронки талантов">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Воронки талантов</h3>
        <Button type="primary" onClick={() => { form.resetFields(); setCreateOpen(true); }}>Создать</Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          dataSource={data?.items ?? []}
          rowKey="id"
          locale={{ emptyText: "Нет воронок" }}
          columns={[
            { title: "Название", dataIndex: "name", key: "name" },
            { title: "Описание", dataIndex: "description", key: "description", render: (v?: string) => v || "—" },
            { title: "Кандидатов", dataIndex: "candidateCount", key: "candidateCount" },
            { title: "Создана", dataIndex: "createdAt", key: "createdAt", render: (v: string) => new Date(v).toLocaleDateString("ru-RU") },
          ]}
        />
      )}

      <Modal title="Создать воронку талантов" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={(v) => createMut.mutate(v)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Python разработчики" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} placeholder="Описание воронки" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>Создать</Button>
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
