"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Select, Button, Card, Space, Checkbox, message, Skeleton } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { appApi, type Vacancy, type CreateVacancyPayload} from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { usePageTitle } from "@/components/usePageTitle";

function VacancyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const editId = searchParams.get("id");
  const isEdit = !!editId;

  const { data: orgUnits } = useQuery({
    queryKey: qk.reference.orgUnits(),
    queryFn: () => appApi.getOrgUnits(),
    staleTime: 300_000,
  });

  const { data: facets } = useQuery({
    queryKey: qk.vacancies.facets(),
    queryFn: () => appApi.getVacancyFacets({ status: "active,paused,distribution" }),
  });

  const { data: grades } = useQuery({
    queryKey: qk.reference.grades(),
    queryFn: () => appApi.getReferenceDictionary("grades"),
    staleTime: 300_000,
  });

  const { data: existingVacancy, isLoading: loadingVacancy } = useQuery({
    queryKey: qk.vacancies.detail(editId!),
    queryFn: () => appApi.getVacancyById(editId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingVacancy) {
      const v = existingVacancy as Vacancy;
      form.setFieldsValue({
        title: v.title,
        orgUnitId: v.orgUnit?.id,
        recruiterId: v.recruiters?.[0]?.id,
        plannedHires: v.plannedHires,
        grade: v.grade,
        salaryFrom: v.salaryFrom,
        salaryTo: v.salaryTo,
        description: v.description,
        isConfidential: v.isConfidential,
      });
    }
  }, [existingVacancy, form]);

  const createMut = useMutation({
    mutationFn: (payload: CreateVacancyPayload) => appApi.createVacancy(payload),
    onSuccess: (resp) => {
      message.success("Вакансия создана");
      qc.invalidateQueries({ queryKey: qk.vacancies.all() });
      qc.invalidateQueries({ queryKey: qk.vacancies.sidebar() });
      router.push(`/vacancy/${resp.id}`);
    },
    onError: () => {
      message.error("Не удалось создать вакансию");
      setSaving(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (payload: Partial<CreateVacancyPayload>) => appApi.updateVacancy(editId!, payload),
    onSuccess: () => {
      message.success("Вакансия обновлена");
      qc.invalidateQueries({ queryKey: qk.vacancies.detail(editId!) });
      qc.invalidateQueries({ queryKey: qk.vacancies.all() });
      qc.invalidateQueries({ queryKey: qk.vacancies.sidebar() });
      qc.invalidateQueries({ queryKey: qk.vacancies.facets() });
      router.push(`/vacancy/${editId}`);
    },
    onError: () => {
      message.error("Не удалось сохранить");
      setSaving(false);
    },
  });

  const orgUnitItems = ((orgUnits as { items?: { id: string; name: string }[] })?.items ?? []);
  const recruiterItems = (facets?.recruiters ?? []);

  if (isEdit && loadingVacancy) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <PageHeader title="Загрузка…" />
        <Skeleton active />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <PageHeader
        title={isEdit ? "Редактирование вакансии" : "Новая вакансия"}
        actions={
          <Space>
            <Button onClick={() => router.back()}>Отмена</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => {
                form.validateFields().then((values) => {
                  setSaving(true);
                  if (isEdit) updateMut.mutate(values);
                  else createMut.mutate(values);
                });
              }}
            >
              {isEdit ? "Сохранить" : "Создать"}
            </Button>
          </Space>
        }
      />
      <Card>
        <Form form={form} layout="vertical" requiredMark>
          <Form.Item label="Название вакансии" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Например: Frontend разработчик" size="large" />
          </Form.Item>
          <Form.Item label="Подразделение" name="orgUnitId">
            <Select
              options={orgUnitItems.map((u) => ({ value: u.id, label: u.name }))}
              placeholder="Выберите подразделение"
            />
          </Form.Item>
          <Form.Item label="Рекрутер" name="recruiterId">
            <Select
              options={recruiterItems.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Выберите рекрутера"
            />
          </Form.Item>
          <Form.Item label="Планируем найм" name="plannedHires" initialValue={1} rules={[{ required: true, message: "Введите количество" }, { type: "number", min: 1, message: "Минимум 1" }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item label="Грейд" name="grade">
            <Select
              options={((grades as { values?: { code: string; name: string }[] })?.values ?? []).map((g) => ({ value: g.code, label: g.name })) || [
                { value: "junior", label: "Junior" },
                { value: "middle", label: "Middle" },
                { value: "senior", label: "Senior" },
                { value: "lead", label: "Lead" },
              ]}
              placeholder="Выберите грейд"
            />
          </Form.Item>
          <Form.Item label="Зарплата от" name="salaryFrom">
            <Input type="number" min={0} placeholder="₽" />
          </Form.Item>
          <Form.Item label="Зарплата до" name="salaryTo" dependencies={["salaryFrom"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const from = getFieldValue("salaryFrom");
                  if (!value || !from || from <= value) return Promise.resolve();
                  return Promise.reject(new Error("«Зарплата до» должна быть больше «Зарплата от»"));
                },
              }),
            ]}
          >
            <Input type="number" min={0} placeholder="₽" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={5} placeholder="Опишите вакансию" />
          </Form.Item>
          <Form.Item label="Конфиденциальная вакансия" name="isConfidential" valuePropName="checked">
            <Checkbox /> Скрыть название от кандидатов
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default function VacancyCreatePage() {
  usePageTitle("Новая вакансия");
  return (
    <Suspense fallback={<div style={{ padding: 24 }}><Skeleton active /></div>}>
      <VacancyForm />
    </Suspense>
  );
}
