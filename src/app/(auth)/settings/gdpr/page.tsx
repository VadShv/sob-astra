"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Input, Button, Table, Tag, Skeleton, message, Popconfirm, Space } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

export default function GdprPage() {
  usePageTitle("GDPR · Настройки");
  const [candidateId, setCandidateId] = useState("");

  const { data: candidates } = useQuery({
    queryKey: qk.candidates.list(),
    queryFn: () => appApi.getCandidates({ page: "1", pageSize: "20" }),
  });

  const exportMut = useMutation({
    mutationFn: (id: string) => appApi.exportCandidateData(id),
    onSuccess: (resp) => {
      message.success("Данные экспортированы");
      window.open(resp.url, "_blank");
    },
    onError: () => message.error("Не удалось экспортировать"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => appApi.deleteCandidateData(id),
    onSuccess: () => message.success("Данные удалены"),
    onError: () => message.error("Не удалось удалить"),
  });

  return (
    <SettingsLayout activeItem="GDPR">
      <Card title="Экспорт и удаление данных кандидата (GDPR)" style={{ marginBottom: 16 }}>
        <Space>
          <Input placeholder="ID кандидата" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} style={{ width: 300 }} />
          <Button disabled={!candidateId} loading={exportMut.isPending} onClick={() => exportMut.mutate(candidateId)}>
            Экспортировать
          </Button>
          <Popconfirm title="Удалить все данные кандидата? Это необратимо." onConfirm={() => deleteMut.mutate(candidateId)}>
            <Button danger disabled={!candidateId} loading={deleteMut.isPending}>Удалить данные</Button>
          </Popconfirm>
        </Space>
      </Card>

      <Card title="Кандидаты">
        <Table
          dataSource={candidates?.items ?? []}
          rowKey="candidateId"
          size="small"
          locale={{ emptyText: "Нет кандидатов" }}
          columns={[
            { title: "Имя", dataIndex: "fullName", key: "fullName" },
            { title: "Email", dataIndex: "email", key: "email" },
            {
              title: "Действия",
              key: "actions",
              width: 200,
              render: (_, r) => (
                <Space>
                  <Button size="small" type="link" onClick={() => exportMut.mutate(r.candidateId)}>Экспорт</Button>
                  <Popconfirm title="Удалить данные?" onConfirm={() => deleteMut.mutate(r.candidateId)}>
                    <Button size="small" type="link" danger>Удалить</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </SettingsLayout>
  );
}
