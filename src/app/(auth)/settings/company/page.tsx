"use client";

import { useEffect } from "react";
import { Form, Input, Button, Select, message, Skeleton } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";
import { qk } from "@/lib/query-keys";

export default function CompanySettingsPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data: company, isLoading } = useQuery({
    queryKey: qk.settings.company(),
    queryFn: () => appApi.getCompany(),
  });

  const { data: regions } = useQuery({
    queryKey: qk.reference.regions(),
    queryFn: () => appApi.getReferenceDictionary("regions"),
  });

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => appApi.updateCompany(values),
    onSuccess: () => {
      message.success("Сохранено");
      qc.invalidateQueries({ queryKey: qk.settings.company() });
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  useEffect(() => {
    if (company) form.setFieldsValue(company);
  }, [company, form]);

  return (
    <SettingsLayout activeItem="Компания">
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ maxWidth: 480 }}
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item label="Название компании" name="name">
            <Input placeholder="Название компании" />
          </Form.Item>
          <Form.Item label="ИНН" name="inn">
            <Input placeholder="ИНН" />
          </Form.Item>
          <Form.Item label="Регион" name="region">
            <Select
              options={((regions as { values?: { code: string; name: string }[] })?.values ?? []).map((r) => ({ value: r.code, label: r.name })) || [
                { value: "moscow", label: "Москва" },
                { value: "spb", label: "Санкт-Петербург" },
                { value: "other", label: "Другой" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Сайт" name="website">
            <Input placeholder="https://company.ru" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} placeholder="Описание компании" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              Сохранить
            </Button>
          </Form.Item>
        </Form>
      )}
    </SettingsLayout>
  );
}
