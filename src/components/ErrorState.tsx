"use client";

import { Button, Empty } from "antd";

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 48 }}>
      <Empty description="Не удалось загрузить данные" />
      {onRetry && (
        <Button type="primary" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
