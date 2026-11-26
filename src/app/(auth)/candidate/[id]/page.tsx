"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton, Tag, Button, Space, Divider, message, Modal, Form, Input, Select, Upload, Tooltip } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Candidate, type CreateCandidatePayload} from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";
import { ErrorState } from "@/components/ErrorState";
import s from "./candidate.module.css";

export default function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  usePageTitle("Кандидат");
  const [addVacancyOpen, setAddVacancyOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editForm] = Form.useForm();
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [vacancyForm] = Form.useForm();

  const { data: candidate, isLoading, isError, refetch } = useQuery({
    queryKey: qk.candidates.detail(id),
    queryFn: () => appApi.getCandidateById(id),
  });

  const { data: candidacies } = useQuery({
    queryKey: qk.candidates.candidacies(id),
    queryFn: () => appApi.getCandidateCandidacies(id),
  });

  const { data: interviews } = useQuery({
    queryKey: qk.candidates.interviews(id),
    queryFn: () => appApi.getCandidateInterviews(id),
  });

  const { data: vacancies } = useQuery({
    queryKey: qk.vacancies.forAdd(),
    queryFn: () => appApi.getVacancies({ status: "active", page: "1", pageSize: "100" }),
  });

  const { data: notesData } = useQuery({
    queryKey: qk.candidates.notes(id),
    queryFn: () => appApi.getCandidateNotes(id),
  });

  const resumeMut = useMutation({
    mutationFn: (file: File) => appApi.uploadResume(id, file),
    onSuccess: () => {
      message.success("Резюме загружено");
      qc.invalidateQueries({ queryKey: qk.candidates.detail(id) });
    },
    onError: () => message.error("Не удалось загрузить"),
  });

  const tagsMut = useMutation({
    mutationFn: (tags: string[]) => appApi.updateCandidateTags(id, tags),
    onSuccess: () => {
      message.success("Метки обновлены");
      qc.invalidateQueries({ queryKey: qk.candidates.detail(id) });
    },
    onError: () => message.error("Не удалось обновить"),
  });

  const noteMut = useMutation({
    mutationFn: (body: string) => appApi.addCandidateNote(id, body),
    onSuccess: () => {
      message.success("Заметка добавлена");
      setNoteText("");
      qc.invalidateQueries({ queryKey: qk.candidates.notes(id) });
    },
    onError: () => message.error("Не удалось добавить"),
  });

  const updateMut = useMutation({
    mutationFn: (payload: Partial<CreateCandidatePayload>) => appApi.updateCandidate(id, payload),
    onSuccess: () => {
      message.success("Кандидат обновлён");
      qc.invalidateQueries({ queryKey: qk.candidates.detail(id) });
      qc.invalidateQueries({ queryKey: qk.candidates.all() });
      setEditOpen(false);
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  const addVacancyMut = useMutation({
    mutationFn: (vacancyId: string) => appApi.addCandidateToVacancy(id, vacancyId),
    onSuccess: () => {
      message.success("Кандидат добавлен на вакансию");
      qc.invalidateQueries({ queryKey: qk.candidates.candidacies(id) });
      qc.invalidateQueries({ queryKey: qk.vacancies.candidacies("") });
      qc.invalidateQueries({ queryKey: qk.conversations.all() });
      setAddVacancyOpen(false);
      vacancyForm.resetFields();
    },
    onError: () => message.error("Не удалось добавить"),
  });

  if (isError) {
    return (
      <div className={s.page}>
        <PageHeader title="Кандидат" />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={s.page}>
        <PageHeader title="Загрузка…" />
        <Skeleton active />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className={s.page}>
        <PageHeader title="Кандидат не найден" />
        <div className={s.panel}>
          <div className={s.empty}>Кандидат не найден или у вас нет доступа.</div>
        </div>
      </div>
    );
  }

  const c = candidate as Candidate;
  const fullName = c.fullName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  const initials = fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const candidacyItems = (candidacies as { items?: Record<string, string>[] })?.items ?? [];
  const interviewItems = (interviews as { items?: Record<string, unknown>[] })?.items ?? [];
  const vacancyItems = vacancies?.items ?? [];

  return (
    <div className={s.page}>
      <PageHeader
        title={fullName}
        actions={
          <>
            <Button onClick={() => {
              editForm.setFieldsValue({
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                phone: c.phone,
                position: c.passport?.title,
                salary: c.passport?.salary,
                area: c.passport?.area,
              });
              setEditOpen(true);
            }}>
              Редактировать
            </Button>
            <Button type="primary" onClick={() => setAddVacancyOpen(true)}>
              Добавить на вакансию
            </Button>
          </>
        }
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Button size="small" href={`/candidate/${id}/interviews`}>Интервью</Button>
        <Button size="small" href={`/candidate/${id}/offers`}>Офферы</Button>
        <Button size="small" href={`/candidate/${id}/documents`}>Документы</Button>
      </div>

      <div className={s.profile}>
        <div className={s.avatar}>{initials}</div>
        <div className={s.profileInfo}>
          <div className={s.profileName}>{fullName}</div>
          <div className={s.profileMeta}>
            {c.email && <span className={s.profileMetaItem}>✉ {c.email}</span>}
            {c.phone && <span className={s.profileMetaItem}>☎ {c.phone}</span>}
            {c.passport?.title && (
              <span className={s.profileMetaItem}>Должность: {c.passport.title}</span>
            )}
            {c.passport?.salary && (
              <span className={s.profileMetaItem}>
                Зарплата: {c.passport.salary.toLocaleString("ru-RU")} ₽
              </span>
            )}
            {c.passport?.area && (
              <span className={s.profileMetaItem}>Город: {c.passport.area}</span>
            )}
            {c.passport?.age && (
              <span className={s.profileMetaItem}>Возраст: {c.passport.age}</span>
            )}
          </div>
          {c.tags?.length ? (
            <Space size={4} wrap style={{ marginTop: 8 }}>
              {c.tags.map((t) => (
                <Tag key={t.id} color={t.color || "default"}>{t.name}</Tag>
              ))}
            </Space>
          ) : null}
        </div>
      </div>

      {c.resume?.skills?.length ? (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Навыки</h3>
          <Space size={4} wrap>
            {c.resume.skills.map((sk) => (
              <Tag key={sk}>{sk}</Tag>
            ))}
          </Space>
        </div>
      ) : null}

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Резюме</h3>
        <Space>
          <Upload
            maxCount={1}
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                await resumeMut.mutateAsync(file as File);
                onSuccess?.({});
              } catch {
                onError?.(new Error("Ошибка"));
              }
            }}
          >
            <Button loading={resumeMut.isPending}>Загрузить резюме</Button>
          </Upload>
          {c.resume?.sourceType && (
            <Tag>Источник: {c.resume.sourceType}</Tag>
          )}
        </Space>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Метки</h3>
        <Space size={4} wrap>
          {c.tags?.map((t) => (
            <Tag
              key={t.id}
              color={t.color || "default"}
              closable
              onClose={() => tagsMut.mutate(c.tags!.filter((x) => x.id !== t.id).map((x) => x.id))}
            >
              {t.name}
            </Tag>
          )) ?? []}
          <Tooltip title="Добавить метку">
            <Tag
              style={{ cursor: "pointer", background: "#fafafa", borderStyle: "dashed" }}
              onClick={() => { setTagName(""); setTagModalOpen(true); }}
            >
              + Добавить
            </Tag>
          </Tooltip>
        </Space>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Заметки</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {((notesData as { items?: Array<{ id: string; body: string; author: string; createdAt: string }> })?.items ?? []).length === 0 ? (
            <div style={{ textAlign: "center", padding: 16, color: "var(--ats-text-3, rgba(0,0,0,.45))" }}>Нет заметок</div>
          ) : ((notesData as { items?: Array<{ id: string; body: string; author: string; createdAt: string }> })?.items ?? []).map((n) => (
            <div key={n.id} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,.03)" }}>
              <div style={{ fontSize: 13 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,.45)", marginTop: 4 }}>
                {n.author} · {new Date(n.createdAt).toLocaleString("ru-RU")}
              </div>
            </div>
          ))}
        </div>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Добавить заметку…"
            onPressEnter={() => noteText.trim() && noteMut.mutate(noteText)}
          />
          <Button type="primary" onClick={() => noteText.trim() && noteMut.mutate(noteText)}>
            Добавить
          </Button>
        </Space.Compact>
      </div>

      <div className={s.panel}>
        <h3 className={s.panelTitle}>Вакансии ({candidacyItems.length})</h3>
        {candidacyItems.length === 0 ? (
          <div className={s.empty}>Кандидат пока не привязан к вакансиям</div>
        ) : (
          candidacyItems.map((cyc) => (
            <div
              key={cyc.candidacyId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                cursor: "pointer",
                borderBottom: "1px solid rgba(0,0,0,.06)",
              }}
              tabIndex={0}
              onClick={() => router.push(`/vacancy/${cyc.vacancyId}`)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/vacancy/${cyc.vacancyId}`); } }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{cyc.vacancyTitle}</div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>
                  {cyc.stageName} · обновлён {new Date(cyc.updatedAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
              <Tag color={cyc.status === "active" ? "green" : "default"}>{cyc.stageType}</Tag>
            </div>
          ))
        )}
      </div>

      {interviewItems.length > 0 && (
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Интервью ИИ ({interviewItems.length})</h3>
          {interviewItems.map((iv) => (
            <div key={iv.interviewId as string} style={{ padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{iv.vacancyTitle as string}</span>
                <Tag color="purple">{iv.status as string}</Tag>
              </div>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)", marginTop: 4 }}>
                {iv.startedAt ? new Date(iv.startedAt as string).toLocaleString("ru-RU") : "—"}
                {iv.score != null && ` · Оценка: ${iv.score}`}
              </div>
              {(iv.summary as string) && (
                <div style={{ fontSize: 13, color: "rgba(0,0,0,.65)", marginTop: 4 }}>
                  {iv.summary as string}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Редактировать кандидата"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.validateFields().then((values) => updateMut.mutate(values))}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={updateMut.isPending}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Имя" name="firstName" rules={[{ required: true, message: "Введите имя" }]}><Input /></Form.Item>
          <Form.Item label="Фамилия" name="lastName" rules={[{ required: true, message: "Введите фамилию" }]}><Input /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Некорректный email" }]}><Input /></Form.Item>
          <Form.Item label="Телефон" name="phone"><Input /></Form.Item>
          <Form.Item label="Должность" name="position"><Input /></Form.Item>
          <Form.Item label="Компания" name="company"><Input /></Form.Item>
          <Form.Item label="Зарплата" name="salary"><Input type="number" min={0} /></Form.Item>
          <Form.Item label="Город" name="area"><Input /></Form.Item>
          <Form.Item label="Комментарий" name="comment"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Добавить на вакансию"
        open={addVacancyOpen}
        onCancel={() => setAddVacancyOpen(false)}
        onOk={() => vacancyForm.validateFields().then((values) => addVacancyMut.mutate(values.vacancyId))}
        okText="Добавить"
        cancelText="Отмена"
        confirmLoading={addVacancyMut.isPending}
      >
        <Form form={vacancyForm} layout="vertical">
          <Form.Item label="Вакансия" name="vacancyId" rules={[{ required: true, message: "Выберите вакансию" }]}>
            <Select
              showSearch
              options={vacancyItems.map((v) => ({ value: v.id, label: v.title }))}
              placeholder="Выберите вакансию"
              filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Новая метка"
        open={tagModalOpen}
        onCancel={() => setTagModalOpen(false)}
        onOk={() => {
          if (tagName.trim()) {
            tagsMut.mutate([...(candidate?.tags?.map((x) => x.id) ?? []), tagName.trim()]);
            setTagModalOpen(false);
          }
        }}
        okText="Добавить"
        cancelText="Отмена"
      >
        <Input
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="Название метки"
          autoFocus
          onPressEnter={() => {
            if (tagName.trim()) {
              tagsMut.mutate([...(candidate?.tags?.map((x) => x.id) ?? []), tagName.trim()]);
              setTagModalOpen(false);
            }
          }}
        />
      </Modal>
    </div>
  );
}
