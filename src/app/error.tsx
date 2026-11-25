"use client";

import { useEffect } from "react";
import { Button } from "antd";

export default function Error({
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      gap: 16,
      padding: 24,
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Что-то пошло не так</h1>
      <p style={{ fontSize: 14, color: "rgba(0,0,0,.45)", maxWidth: 400, textAlign: "center" }}>
        {error.message || "Произошла ошибка при загрузке страницы."}
      </p>
      <Button type="primary" onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
