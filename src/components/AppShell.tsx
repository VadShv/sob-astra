"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import s from "./app-shell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={s.shell}>
      <Sidebar />
      <div className={s.resizer} />
      <div className={s.sheetLayer} />
      <main className={s.sheet} id="ats-screen" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
