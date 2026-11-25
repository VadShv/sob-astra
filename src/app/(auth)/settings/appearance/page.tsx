"use client";

import { Form, Input, ColorPicker, Button, Upload, Divider, message } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";

export default function AppearanceSettingsPage() {
  return (
    <SettingsLayout activeItem="Оформление интервью">
      <Form
        layout="vertical"
        style={{ maxWidth: 520 }}
        onFinish={() => message.success("Сохранено")}
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
          <Button type="primary" htmlType="submit">Сохранить</Button>
        </Form.Item>
      </Form>
    </SettingsLayout>
  );
}
