"use client";

import { Form, Input, Button, Select } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";

export default function CompanySettingsPage() {
  return (
    <SettingsLayout activeItem="Компания">
      <Form layout="vertical" requiredMark={false} style={{ maxWidth: 480 }}>
        <Form.Item label="Название компании" name="name">
          <Input placeholder="Название компании" />
        </Form.Item>
        <Form.Item label="ИНН" name="inn">
          <Input placeholder="ИНН" />
        </Form.Item>
        <Form.Item label="Регион" name="region">
          <Select
            options={[
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
          <Button type="primary" htmlType="submit">Сохранить</Button>
        </Form.Item>
      </Form>
    </SettingsLayout>
  );
}
