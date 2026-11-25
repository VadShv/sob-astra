"use client";

import { useEffect } from "react";
import { Button, message } from "antd";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h2 style={{ marginBottom: 8 }}>Ошибка загрузки страницы</h2>
      <p style={{ color: "rgba(0,0,0,.45)", marginBottom: 16 }}>
        {error.message || "Попробуйте обновить страницу"}
      </p>
      <Button type="primary" onClick={reset}>Обновить</Button>
    </div>
  );
}
