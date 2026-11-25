"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Tag, Skeleton, Modal, Form, Input, message } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";

export default function FunnelsSettingsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["funnel-templates"],
    queryFn: () => appApi.getFunnels(),
  });

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => appApi.createFunnel(payload),
    onSuccess: () => {
      message.success("Воронка создана");
      qc.invalidateQueries({ queryKey: ["funnel-templates"] });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать"),
  });

  const funnels = data?.items ?? [];

  return (
    <SettingsLayout activeItem="Воронки">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Воронки</h3>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Создать воронку
        </Button>
      </div>
      {isLoading ? (
        <Skeleton active />
      ) : funnels.length === 0 ? (
        <div style={{ padding: 20, border: "1px solid #f0f0f0", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Стандартная воронка</div>
            <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginTop: 4 }}>
              Отклик → Новые → Оценка резюме → Голосовое интервью → Одобрен
            </div>
          </div>
          <Tag color="green">По умолчанию</Tag>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {funnels.map((f) => (
            <div
              key={f.id}
              style={{
                padding: 20,
                border: "1px solid #f0f0f0",
                borderRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{f.name}</div>
                <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginTop: 4 }}>
                  {f.stages?.map((st) => st.name).join(" → ") || "Этапы не заданы"}
                </div>
              </div>
              <Tag color="green">По умолчанию</Tag>
            </div>
          ))}
        </div>
      )}
      <Modal
        title="Новая воронка"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => createMut.mutate(values));
        }}
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createMut.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Воронка для IT" />
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
