"use client";

import { Form, Switch, Button, Divider } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";

export default function NotificationsSettingsPage() {
  return (
    <SettingsLayout activeItem="Уведомления">
      <Form layout="vertical" style={{ maxWidth: 480 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Email-уведомления
        </div>
        <Form.Item name="newCandidate" valuePropName="checked" initialValue={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 500 }}>Новый кандидат</div>
              <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
                Когда кандидат откликается на вакансию
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </Form.Item>
        <Divider />
        <Form.Item name="aiInterview" valuePropName="checked" initialValue={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 500 }}>Интервью ИИ завершено</div>
              <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
                Когда ИИ заканчивает интервью с кандидатом
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </Form.Item>
        <Divider />
        <Form.Item name="candidateReply" valuePropName="checked" initialValue={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 500 }}>Ответ кандидата</div>
              <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
                Когда кандидат отвечает на сообщение
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </Form.Item>
        <Divider />
        <Form.Item name="dailyDigest" valuePropName="checked" initialValue={false}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 500 }}>Ежедневный дайджест</div>
              <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)" }}>
                Сводка за день каждое утро
              </div>
            </div>
            <Switch />
          </div>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Сохранить</Button>
        </Form.Item>
      </Form>
    </SettingsLayout>
  );
}
