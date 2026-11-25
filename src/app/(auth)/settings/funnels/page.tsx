"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Tag, Skeleton, Modal, Form, Input, Space, message, Popconfirm } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";

const DEFAULT_STAGES = [
  { name: "Отклик", type: "new" },
  { name: "Новые", type: "new" },
  { name: "Оценка резюме", type: "review" },
  { name: "Голосовое интервью", type: "interview" },
  { name: "Одобрен", type: "offer" },
];

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
        <Button type="primary" onClick={() => {
          form.resetFields();
          form.setFieldsValue({ stages: DEFAULT_STAGES });
          setCreateOpen(true);
        }}>
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
              {DEFAULT_STAGES.map((s) => s.name).join(" → ")}
            </div>
          </div>
          <Tag color="green">По умолчанию</Tag>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {funnels.map((f, i) => (
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
              <Space>
                {i === 0 && <Tag color="green">По умолчанию</Tag>}
                <Button type="text" size="small" onClick={() => message.info("Редактирование воронки — в разработке")}>Изменить</Button>
                <Popconfirm title="Удалить воронку?" onConfirm={() => message.info("Удаление — в разработке")}>
                  <Button type="text" size="small" danger>Удалить</Button>
                </Popconfirm>
              </Space>
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
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Воронка для IT" />
          </Form.Item>
          <Form.Item label="Этапы">
            <Form.List name="stages">
              {(fields, { add, remove, move }) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {fields.map((field, idx) => (
                    <Space key={field.key} align="center">
                      <span style={{ color: "rgba(0,0,0,.45)", width: 24, textAlign: "center" }}>{idx + 1}</span>
                      <Form.Item name={[field.name, "name"]} noStyle rules={[{ required: true, message: "Введите название этапа" }]}>
                        <Input placeholder="Название этапа" style={{ width: 200 }} />
                      </Form.Item>
                      <Form.Item name={[field.name, "type"]} noStyle>
                        <Input placeholder="Тип" style={{ width: 100 }} />
                      </Form.Item>
                      <Button type="text" size="small" disabled={idx === 0} onClick={() => move(idx, idx - 1)}>↑</Button>
                      <Button type="text" size="small" disabled={idx === fields.length - 1} onClick={() => move(idx, idx + 1)}>↓</Button>
                      <Button type="text" size="small" danger disabled={fields.length <= 1} onClick={() => remove(field.name)}>×</Button>
                    </Space>
                  ))}
                  <Button type="dashed" block onClick={() => add({ name: "", type: "new" })}>
                    + Добавить этап
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
