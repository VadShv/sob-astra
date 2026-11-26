"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Table, Button, Upload, message, Popconfirm, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { usePageTitle } from "@/components/usePageTitle";
import type { UploadProps } from "antd";
import s from "./documents.module.css";

interface DocItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1048576).toFixed(1)} МБ`;
}

export default function CandidateDocumentsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const qc = useQueryClient();
  usePageTitle("Документы · Собесо");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["candidate-documents", token],
    queryFn: () => appApi.getCandidateDocumentsByToken(token),
  });

  const deleteMut = useMutation({
    mutationFn: (docId: string) => appApi.deleteCandidateDocumentByToken(token, docId),
    onSuccess: () => {
      message.success("Документ удалён");
      qc.invalidateQueries({ queryKey: ["candidate-documents", token] });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const uploadProps: UploadProps = {
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await appApi.uploadCandidateDocumentByToken(token, file as File);
        message.success("Файл загружен");
        qc.invalidateQueries({ queryKey: ["candidate-documents", token] });
        onSuccess?.({}, new XMLHttpRequest());
      } catch {
        message.error("Не удалось загрузить");
        onError?.(new Error("Upload failed"));
      }
    },
    showUploadList: false,
    multiple: true,
  };

  const columns: ColumnsType<DocItem> = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      render: (v: string, r) => r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{v}</a> : v,
    },
    { title: "Тип", dataIndex: "type", key: "type", width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: "Размер", dataIndex: "size", key: "size", width: 100, render: (v: number) => formatSize(v) },
    {
      title: "Загружен",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      width: 140,
      render: (v: string) => new Date(v).toLocaleDateString("ru-RU"),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <Popconfirm title="Удалить документ?" onConfirm={() => deleteMut.mutate(r.id)}>
          <Button size="small" type="link" danger>Удалить</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1>Мои документы</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button href={`/portal/${token}`}>← Назад</Button>
          <Upload {...uploadProps}>
            <Button type="primary">Загрузить файл</Button>
          </Upload>
        </div>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table<DocItem>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          locale={{ emptyText: "Нет документов" }}
          pagination={false}
        />
      )}
    </div>
  );
}
