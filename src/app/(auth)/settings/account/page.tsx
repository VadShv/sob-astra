"use client";

import { useEffect } from "react";
import { Form, Input, Button, Select, Divider, message, Skeleton, Upload, Switch, Tag, Space, Popconfirm, List } from "antd";
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

  const { data: tfaStatus } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: () => appApi.get2FAStatus(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: () => appApi.getSessions(),
  });

  const avatarMut = useMutation({
    mutationFn: (file: File) => appApi.uploadAvatar(file),
    onSuccess: () => {
      message.success("Аватар загружен");
      qc.invalidateQueries({ queryKey: ["auth-me"] });
    },
    onError: () => message.error("Не удалось загрузить"),
  });

  const tfaMut = useMutation({
    mutationFn: ({ action, code }: { action: "enable" | "disable"; code?: string }) =>
      action === "enable" ? appApi.enable2FA(code!) : appApi.disable2FA(),
    onSuccess: () => {
      message.success("2FA обновлён");
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: () => message.error("Не удалось обновить"),
  });

  const revokeMut = useMutation({
    mutationFn: (sessionId: string) => appApi.revokeSession(sessionId),
    onSuccess: () => {
      message.success("Сессия завершена");
      qc.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: () => message.error("Не удалось завершить"),
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
        <>
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

        <Divider />

        <div style={{ maxWidth: 480 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Аватар</h3>
          <Upload
            maxCount={1}
            listType="picture-card"
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                await avatarMut.mutateAsync(file as File);
                onSuccess?.({});
              } catch {
                onError?.(new Error("Ошибка"));
              }
            }}
          >
            <div style={{ color: "rgba(0,0,0,.45)" }}>Загрузить</div>
          </Upload>
        </div>

        <Divider />

        <div style={{ maxWidth: 480 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Двухфакторная аутентификация</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 500 }}>Защита аккаунта</div>
              <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
                {tfaStatus?.enabled ? "2FA включена" : "Требуется код из приложения при входе"}
              </div>
            </div>
            <Popconfirm
              title={tfaStatus?.enabled ? "Отключить 2FA?" : "Включить 2FA?"}
              onConfirm={() => tfaMut.mutate({ action: tfaStatus?.enabled ? "disable" : "enable", code: "000000" })}
            >
              <Switch checked={tfaStatus?.enabled ?? false} loading={tfaMut.isPending} />
            </Popconfirm>
          </div>
        </div>

        <Divider />

        <div style={{ maxWidth: 480 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Активные сессии</h3>
          <List
            dataSource={sessionsData?.items ?? []}
            locale={{ emptyText: "Нет активных сессий" }}
            renderItem={(session) => (
              <List.Item
                actions={
                  session.current
                    ? undefined
                    : [<Popconfirm key="revoke" title="Завершить сессию?" onConfirm={() => revokeMut.mutate(session.id)}><Button type="text" size="small" danger>Завершить</Button></Popconfirm>]
                }
              >
                <List.Item.Meta
                  title={<Space>{session.device}{session.current && <Tag color="green">Текущая</Tag>}</Space>}
                  description={`${session.ip} · ${new Date(session.lastActiveAt).toLocaleString("ru-RU")}`}
                />
              </List.Item>
            )}
          />
        </div>
        </>
      )}
    </SettingsLayout>
  );
}
