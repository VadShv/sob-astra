"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, Skeleton, Space, message, Popconfirm } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

export default function ScorecardTemplatesPage() {
  usePageTitle("Шаблоны скоркарт · Настройки");
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.interviews.scorecardTemplates(),
    queryFn: () => appApi.getScorecardTemplates(),
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; sections: Array<{ name: string; skills?: string[] }> }) =>
      appApi.createScorecardTemplate(payload),
    onSuccess: () => {
      message.success("Шаблон создан");
      qc.invalidateQueries({ queryKey: qk.interviews.scorecardTemplates() });
      setCreateOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Не удалось создать шаблон"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => appApi.deleteScorecardTemplate(id),
    onSuccess: () => {
      message.success("Шаблон удалён");
      qc.invalidateQueries({ queryKey: qk.interviews.scorecardTemplates() });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  return (
    <SettingsLayout activeItem="Шаблоны скоркарт">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Шаблоны скоркарт</h3>
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
          dataSource={data ?? []}
          rowKey="id"
          locale={{ emptyText: "Нет шаблонов" }}
          columns={[
            { title: "Название", dataIndex: "name", key: "name" },
            { title: "Секций", key: "sections", render: (_, r) => r.sections?.length ?? 0 },
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

      <Modal title="Создать шаблон скоркарты" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={560}>
        <Form form={form} layout="vertical" onFinish={(v) => createMut.mutate(v)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Frontend разработчик" />
          </Form.Item>
          <Form.Item label="Секции (через запятую)" name="sectionNames" rules={[{ required: true, message: "Введите секции" }]}>
            <Input.TextArea rows={4} placeholder="Технические навыки&#10;Коммуникация&#10;Опыт работы" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMut.isPending}
              onClick={() => {
                const sections = form.getFieldValue("sectionNames")?.split("\n").filter(Boolean).map((name: string) => ({ name: name.trim() }));
                form.setFieldValue("sections", sections);
              }}
            >
              Создать
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </SettingsLayout>
  );
}
