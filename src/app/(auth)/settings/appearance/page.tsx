"use client";

import { useEffect } from "react";
import { Form, Input, ColorPicker, Button, Upload, Divider, message, Skeleton } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsLayout } from "@/components/SettingsLayout";
import { appApi } from "@/lib/api";

export default function AppearanceSettingsPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["appearance-settings"],
    queryFn: () => appApi.getAppearanceSettings(),
  });

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => appApi.updateAppearanceSettings(values),
    onSuccess: () => {
      message.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["appearance-settings"] });
    },
    onError: () => message.error("Не удалось сохранить"),
  });

  useEffect(() => {
    if (settings) form.setFieldsValue(settings);
  }, [settings, form]);

  return (
    <SettingsLayout activeItem="Оформление интервью">
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 520 }}
          onFinish={(values) => mutation.mutate(values)}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Оформление страницы интервью
          </div>
          <Form.Item label="Название компании" name="companyName">
            <Input placeholder="Например: Группа компаний Астра" />
          </Form.Item>
          <Form.Item label="Логотип" name="logo">
            <Upload maxCount={1} listType="picture-card">
              <div style={{ color: "rgba(0,0,0,.45)" }}>Нажмите для загрузки</div>
            </Upload>
          </Form.Item>
          <Divider />
          <Form.Item label="Основной цвет" name="primaryColor">
            <ColorPicker defaultValue="#6B53D5" showText />
          </Form.Item>
          <Form.Item label="Цвет фона" name="bgColor">
            <ColorPicker defaultValue="#FFFFFF" showText />
          </Form.Item>
          <Form.Item label="Цвет текста" name="textColor">
            <ColorPicker defaultValue="#151716" showText />
          </Form.Item>
          <Divider />
          <Form.Item label="Приветственный текст" name="welcomeText">
            <Input.TextArea
              rows={3}
              placeholder="Текст, который увидит кандидат перед началом интервью"
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
