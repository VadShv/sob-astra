"use client";

import { useEffect } from "react";
import { Form, Input, Button, Select, Divider, message, Skeleton } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsLayout } from "@/components/SettingsLayout";
import { authApi, appApi } from "@/lib/api";

export default function AccountSettingsPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
  });

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => appApi.updateAccount(values),
    onSuccess: () => {
      message.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["auth-me"] });
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  useEffect(() => {
    if (user?.user) {
      form.setFieldsValue({
        firstName: user.user.first_name,
        lastName: user.user.last_name,
        email: user.user.email,
        locale: "ru",
        timezone: "Europe/Moscow",
      });
    }
  }, [user, form]);

  return (
    <SettingsLayout activeItem="Учётная запись">
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ maxWidth: 480 }}
          onFinish={(values) => {
            const payload: Record<string, unknown> = {
              firstName: values.firstName,
              lastName: values.lastName,
              middleName: values.middleName,
              locale: values.locale,
              timezone: values.timezone,
            };
            if (values.newPassword) {
              payload.currentPassword = values.currentPassword;
              payload.newPassword = values.newPassword;
            }
            mutation.mutate(payload);
          }}
        >
          <Form.Item label="Имя" name="firstName">
            <Input placeholder="Имя" />
          </Form.Item>
          <Form.Item label="Фамилия" name="lastName">
            <Input placeholder="Фамилия" />
          </Form.Item>
          <Form.Item label="Отчество" name="middleName">
            <Input placeholder="Отчество" />
          </Form.Item>
          <Form.Item label="Рабочая почта" name="email">
            <Input disabled />
          </Form.Item>
          <Divider />
          <Form.Item label="Текущий пароль" name="currentPassword">
            <Input.Password placeholder="Введите текущий пароль" />
          </Form.Item>
          <Form.Item label="Новый пароль" name="newPassword">
            <Input.Password placeholder="Введите новый пароль" />
          </Form.Item>
          <Form.Item label="Повторите новый пароль" name="confirmPassword" dependencies={["newPassword"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("Пароли не совпадают"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Повторите новый пароль" />
          </Form.Item>
          <Divider />
          <Form.Item label="Язык интерфейса" name="locale" initialValue="ru">
            <Select
              options={[
                { value: "ru", label: "Русский" },
                { value: "en", label: "English" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Часовой пояс" name="timezone" initialValue="Europe/Moscow">
            <Select
              options={[
                { value: "Europe/Moscow", label: "Москва (UTC+3)" },
                { value: "Europe/Kaliningrad", label: "Калининград (UTC+2)" },
                { value: "Asia/Yekaterinburg", label: "Екатеринбург (UTC+5)" },
                { value: "Asia/Novosibirsk", label: "Новосибирск (UTC+7)" },
              ]}
            />
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
