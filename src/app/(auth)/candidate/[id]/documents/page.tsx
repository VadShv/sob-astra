"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Table, Button, Upload, message, Popconfirm, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import type { UploadProps } from "antd";

interface CandidateDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: string;
  url?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function CandidateDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  usePageTitle("Документы · Кандидат");

  const { data: candidate } = useQuery({
    queryKey: qk.candidates.detail(id),
    queryFn: () => appApi.getCandidateById(id),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.documents.list(id),
    queryFn: () => appApi.getCandidateDocuments(id),
  });

  const deleteMut = useMutation({
    mutationFn: (docId: string) => appApi.deleteCandidateDocument(id, docId),
    onSuccess: () => {
      message.success("Документ удалён");
      qc.invalidateQueries({ queryKey: qk.documents.list(id) });
    },
    onError: () => message.error("Не удалось удалить"),
  });

  const uploadProps: UploadProps = {
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await appApi.uploadCandidateDocument(id, file as File);
        message.success("Документ загружен");
        qc.invalidateQueries({ queryKey: qk.documents.list(id) });
        onSuccess?.({}, new XMLHttpRequest());
      } catch {
        message.error("Не удалось загрузить");
        onError?.(new Error("Upload failed"));
      }
    },
    showUploadList: false,
    multiple: true,
  };

  const columns: ColumnsType<CandidateDocument> = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      render: (v: string, r) => r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{v}</a> : v,
    },
    {
      title: "Тип",
      dataIndex: "mimeType",
      key: "mimeType",
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Размер",
      dataIndex: "size",
      key: "size",
      width: 100,
      render: (v: number) => formatSize(v),
    },
    {
      title: "Загружен",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleDateString("ru-RU"),
    },
    {
      title: "Кем",
      dataIndex: "uploadedBy",
      key: "uploadedBy",
      width: 140,
      render: (v?: string) => v || "—",
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
    <div>
      <PageHeader
        title={candidate?.fullName ?? "Документы"}
        sub="Документы и файлы кандидата"
        actions={
          <>
            <Button href={`/candidate/${id}`}>← Профиль</Button>
            <Upload {...uploadProps}>
              <Button type="primary">Загрузить файл</Button>
            </Upload>
          </>
        }
      />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton active />
      ) : (
        <Table<CandidateDocument>
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
