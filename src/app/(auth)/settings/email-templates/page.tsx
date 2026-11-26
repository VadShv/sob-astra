"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Modal, Form, Input, Skeleton, Tag, message, Popconfirm, Card } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

export default function EmailTemplatesPage() {
  usePageTitle("Email-шаблоны · Настройки");
  const qc = useQueryClient();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewVars, setPreviewVars] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => appApi.getEmailTemplates(),
  });

  const previewMut = useMutation({
    mutationFn: ({ templateId, variables }: { templateId: string; variables: Record<string, string> }) =>
      appApi.renderEmailTemplate(templateId, variables),
    onError: () => message.error("Не удалось отрендерить"),
  });

  const handlePreview = (templateId: string) => {
    const vars: Record<string, string> = {};
    previewVars.split("\n").forEach((line) => {
      const [k, v] = line.split("=").map((s) => s.trim());
      if (k && v) vars[k] = v;
    });
    previewMut.mutate({ templateId, variables: vars });
    setPreviewId(templateId);
  };

  return (
    <SettingsLayout activeItem="Email-шаблоны">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Email-шаблоны</h3>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <Table
            dataSource={data?.items ?? []}
            rowKey="id"
            locale={{ emptyText: "Нет шаблонов" }}
            columns={[
              { title: "Название", dataIndex: "name", key: "name" },
              { title: "Тема", dataIndex: "subject", key: "subject" },
              {
                title: "Переменные",
                dataIndex: "variables",
                key: "variables",
                render: (vars: string[]) => vars?.map((v) => <Tag key={v}>{v}</Tag>) ?? "—",
              },
              {
                title: "Действия",
                key: "actions",
                width: 100,
                render: (_, r) => (
                  <Button size="small" type="link" onClick={() => { setPreviewId(r.id); setPreviewVars(""); previewMut.reset(); }}>
                    Preview
                  </Button>
                ),
              },
            ]}
          />

          <Modal
            title="Предпросмотр шаблона"
            open={!!previewId}
            onCancel={() => setPreviewId(null)}
            footer={null}
            width={640}
          >
            <Form layout="vertical">
              <Form.Item label="Переменные (по одной на строку, формат key=value)">
                <Input.TextArea
                  rows={4}
                  value={previewVars}
                  onChange={(e) => setPreviewVars(e.target.value)}
                  placeholder={"candidateName=Иван Иванов\ncompany=Астра"}
                />
              </Form.Item>
              <Button type="primary" loading={previewMut.isPending} onClick={() => previewId && handlePreview(previewId)}>
                Рендер
              </Button>
            </Form>

            {previewMut.data && (
              <Card style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Тема: </strong>{previewMut.data.subject}
                </div>
                <div>
                  <strong>Текст:</strong>
                  <pre style={{ whiteSpace: "pre-wrap", background: "rgba(0,0,0,.04)", padding: 12, borderRadius: 8, marginTop: 4 }}>
                    {previewMut.data.body}
                  </pre>
                </div>
              </Card>
            )}
          </Modal>
        </>
      )}
    </SettingsLayout>
  );
}
