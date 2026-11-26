"use client";

import { Button } from "antd";

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 48 }}>
      <div style={{ fontSize: 14, color: "rgba(0,0,0,.45)" }}>Не удалось загрузить данные</div>
      {onRetry && (
        <Button type="primary" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
