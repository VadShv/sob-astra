"use client";

import { Form, Input, Button, Select, Divider } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";

export default function AccountSettingsPage() {
  return (
    <SettingsLayout activeItem="Учётная запись">
      <Form layout="vertical" requiredMark={false} style={{ maxWidth: 480 }}>
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
          <Input placeholder="email@company.ru" />
        </Form.Item>
        <Divider />
        <Form.Item label="Текущий пароль" name="currentPassword">
          <Input.Password placeholder="Введите текущий пароль" />
        </Form.Item>
        <Form.Item label="Новый пароль" name="newPassword">
          <Input.Password placeholder="Введите новый пароль" />
        </Form.Item>
        <Form.Item label="Повторите новый пароль" name="confirmPassword">
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
          <Button type="primary" htmlType="submit">Сохранить</Button>
        </Form.Item>
      </Form>
    </SettingsLayout>
  );
}
