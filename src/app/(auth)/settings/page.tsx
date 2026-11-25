"use client";

import { SettingsLayout, SECTIONS } from "@/components/SettingsLayout";
import s from "./settings.module.css";

export default function SettingsPage() {
  return (
    <SettingsLayout activeItem="">
      {SECTIONS.flatMap((section) => section.items).map((item) => (
        <div key={item.label} className={s.card}>
          <div className={s.cardTitle}>{item.label}</div>
          <div className={s.cardDesc}>{item.desc}</div>
        </div>
      ))}
    </SettingsLayout>
  );
}
