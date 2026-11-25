"use client";

import Link from "next/link";
import { Button } from "antd";

export default function NotFound() {
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
      <h1 style={{ fontSize: 72, fontWeight: 800, color: "#6B53D5", margin: 0 }}>404</h1>
      <p style={{ fontSize: 18, color: "rgba(0,0,0,.45)" }}>Страница не найдена</p>
      <Link href="/home">
        <Button type="primary" size="large">На главную</Button>
      </Link>
    </div>
  );
}
