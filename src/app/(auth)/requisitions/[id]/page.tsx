"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Tag, Button, Descriptions, Popconfirm, message, Space, Modal, Input } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  cancelled: "default",
};

export default function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  usePageTitle("Заявка");

  const { data: req, isLoading, isError, refetch } = useQuery({
    queryKey: qk.requisitions.detail(id),
    queryFn: () => appApi.getRequisitionById(id),
  });

  const { data: approvalsData } = useQuery({
    queryKey: qk.requisitions.approvals(id),
    queryFn: () => appApi.getRequisitionApprovals(id),
  });

  const submitMut = useMutation({
    mutationFn: () => appApi.submitRequisition(id),
    onSuccess: () => {
      message.success("Заявка отправлена");
      qc.invalidateQueries({ queryKey: qk.requisitions.detail(id) });
    },
    onError: () => message.error("Не удалось отправить"),
  });

  const cancelMut = useMutation({
    mutationFn: () => appApi.cancelRequisition(id),
    onSuccess: () => {
      message.success("Заявка отменена");
      qc.invalidateQueries({ queryKey: qk.requisitions.detail(id) });
    },
    onError: () => message.error("Не удалось отменить"),
  });

  const withdrawMut = useMutation({
    mutationFn: () => appApi.withdrawRequisition(id),
    onSuccess: () => {
      message.success("Заявка отозвана");
      qc.invalidateQueries({ queryKey: qk.requisitions.detail(id) });
    },
    onError: () => message.error("Не удалось отозвать"),
  });

  const approveMut = useMutation({
    mutationFn: (comment?: string) => appApi.approveRequisition(id, comment),
    onSuccess: () => {
      message.success("Заявка одобрена");
      qc.invalidateQueries({ queryKey: qk.requisitions.detail(id) });
      qc.invalidateQueries({ queryKey: qk.requisitions.approvals(id) });
    },
    onError: () => message.error("Не удалось одобрить"),
  });

  const rejectMut = useMutation({
    mutationFn: (reason: string) => appApi.rejectRequisition(id, reason),
    onSuccess: () => {
      message.success("Заявка отклонена");
      setRejectOpen(false);
      qc.invalidateQueries({ queryKey: qk.requisitions.detail(id) });
      qc.invalidateQueries({ queryKey: qk.requisitions.approvals(id) });
    },
    onError: () => message.error("Не удалось отклонить"),
  });

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (isError) {
    return (
      <div>
        <PageHeader title="Заявка" />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !req) {
    return (
      <div>
        <PageHeader title="Загрузка…" />
        <Skeleton active />
      </div>
    );
  }

  const approvals = approvalsData?.items ?? [];

  return (
    <div>
      <PageHeader
        title={req.title}
        sub={`Статус: ${req.status}`}
        actions={
          <Space>
            {req.status === "draft" && (
              <Popconfirm title="Отправить на согласование?" onConfirm={() => submitMut.mutate()}>
                <Button type="primary" loading={submitMut.isPending}>Отправить</Button>
              </Popconfirm>
            )}
            {req.status === "pending" && (
              <Popconfirm title="Отозвать заявку?" onConfirm={() => withdrawMut.mutate()}>
                <Button loading={withdrawMut.isPending}>Отозвать</Button>
              </Popconfirm>
            )}
            {req.status !== "cancelled" && req.status !== "approved" && (
              <Popconfirm title="Отменить заявку?" onConfirm={() => cancelMut.mutate()}>
                <Button danger loading={cancelMut.isPending}>Отменить</Button>
              </Popconfirm>
            )}
            {req.status === "pending" && (
              <>
                <Popconfirm title="Одобрить заявку?" onConfirm={() => approveMut.mutate()}>
                  <Button type="primary" loading={approveMut.isPending}>Одобрить</Button>
                </Popconfirm>
                <Button danger loading={rejectMut.isPending} onClick={() => setRejectOpen(true)}>
                  Отклонить
                </Button>
              </>
            )}
          </Space>
        }
      />

      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Должность">{req.title}</Descriptions.Item>
        <Descriptions.Item label="Статус">
          <Tag color={STATUS_COLORS[req.status] || "default"}>{req.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Отдел">{req.department || "—"}</Descriptions.Item>
        <Descriptions.Item label="Позиция">{req.position || "—"}</Descriptions.Item>
        <Descriptions.Item label="Планируем найм">{req.plannedHires ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Зарплата">
          {req.salaryFrom || req.salaryTo ? `${req.salaryFrom ?? "—"}–${req.salaryTo ?? "—"}` : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Автор">{req.author?.name ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Создана">{new Date(req.createdAt).toLocaleDateString("ru-RU")}</Descriptions.Item>
        <Descriptions.Item label="Обоснование" span={2}>{req.justification || "—"}</Descriptions.Item>
      </Descriptions>

      {approvals.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Согласование</h3>
          {approvals.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--ats-border-2, #f0f0f0)" }}>
              <span style={{ fontWeight: 500 }}>{a.approver}</span>
              <Space>
                <Tag color={STATUS_COLORS[a.status] || "default"}>{a.status}</Tag>
                <span style={{ fontSize: 12, color: "var(--ats-text-3, rgba(0,0,0,.45))" }}>
                  {new Date(a.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </Space>
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Отклонить заявку"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => {
          if (rejectReason.trim()) rejectMut.mutate(rejectReason);
          else message.warning("Укажите причину");
        }}
        okText="Отклонить"
        cancelText="Отмена"
        confirmLoading={rejectMut.isPending}
      >
        <Input.TextArea
          rows={4}
          placeholder="Причина отклонения…"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
