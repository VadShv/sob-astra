"use client";

import { Button, Tag, Empty } from "antd";
import { SettingsLayout } from "@/components/SettingsLayout";

export default function FunnelsSettingsPage() {
  return (
    <SettingsLayout activeItem="Воронки">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Воронки</h3>
        <Button type="primary">Создать воронку</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            padding: 20,
            border: "1px solid #f0f0f0",
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Стандартная воронка</div>
            <div style={{ fontSize: 13, color: "rgba(0,0,0,.45)", marginTop: 4 }}>
              Отклик → Новые → Оценка резюме → Голосовое интервью → Одобрен
            </div>
          </div>
          <Tag color="green">По умолчанию</Tag>
        </div>
      </div>
    </SettingsLayout>
  );
}
