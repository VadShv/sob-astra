"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dropdown, Badge } from "antd";
import { authApi, appApi, type Vacancy } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useThemeMode } from "@/components/ThemeProvider";
import s from "./sidebar.module.css";

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICONS = {
  home: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  search: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  ),
  messages: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  ),
  chart: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  ),
  plug: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  ),
  settings: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.73v-.18a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  megaphone: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  bell: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.05 2.5a2 2 0 0 1 3.9 0" />
      <path d="M6 6a6 6 0 0 1 12 0c0 5 3 6 3 6H3s3-1 3-6" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  calendar: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  checkSquare: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  clipboard: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M4 6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
    </svg>
  ),
  logout: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  user: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Главная", icon: ICONS.home },
  { href: "/onboarding", label: "Онбординг", icon: ICONS.checkSquare },
  { href: "/search", label: "Поиск", icon: ICONS.search },
  { href: "/messages", label: "Сообщения", icon: ICONS.messages },
  { href: "/analytics", label: "Аналитика", icon: ICONS.chart },
  { href: "/calendar", label: "Календарь", icon: ICONS.calendar },
  { href: "/tasks", label: "Задачи", icon: ICONS.checkSquare },
  { href: "/requisitions", label: "Заявки", icon: ICONS.clipboard },
  { href: "/notifications", label: "Уведомления", icon: ICONS.bell },
  { href: "/settings/integrations", label: "Интеграции", icon: ICONS.plug },
  { href: "/settings", label: "Настройки", icon: ICONS.settings },
  { href: "/whats-new", label: "Что нового", icon: ICONS.megaphone },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  const { data: userResp } = useQuery({
    queryKey: qk.auth.me(),
    queryFn: () => authApi.me(),
  });

  const { data: vacancies } = useQuery({
    queryKey: qk.vacancies.sidebar(),
    queryFn: () =>
      appApi.getVacancies({
        status: "active,paused,distribution",
        showAllVacancies: "true",
        groupMulti: "true",
        page: "1",
        pageSize: "20",
      }),
  });

  const { data: unread } = useQuery({
    queryKey: qk.notifications.unread(),
    queryFn: () => appApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const { data: awaiting } = useQuery({
    queryKey: qk.notifications.awaiting(),
    queryFn: () => appApi.getAwaitingCount(),
    refetchInterval: 30000,
  });

  const vacancyItems: Vacancy[] = vacancies?.items ?? [];
  const userName = userResp?.user?.first_name ?? "";
  const userEmail = userResp?.user?.email ?? "";
  const unreadCount = unread?.count ?? 0;
  const awaitingCount = awaiting?.count ?? 0;
  const notifCount = unreadCount + awaitingCount;
  const { mode, toggle } = useThemeMode();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
    }
    router.push("/login");
  };

  const userMenuItems = [
    {
      key: "profile",
      label: userEmail,
      disabled: true,
    },
    { type: "divider" as const },
    {
      key: "logout",
      label: "Выйти",
      icon: ICONS.logout,
      onClick: handleLogout,
    },
  ];

  return (
    <aside
      className={`${s.sidebar} ${collapsed ? s.collapsed : ""}`}
      aria-label="Основная навигация"
    >
      <div className={s.brand}>
        <Link aria-label="Собесо — главная" href="/home">
          <img alt="Собесо" src="/images/ats-brand/logo-sobesso.png" />
        </Link>
        <button
          type="button"
          className={s.collapseBtn}
          aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="12" height="10" rx="1.5" />
            <path d="M10 3v10" />
            <path d="M5.5 6.5 7.5 8l-2 1.5" />
          </svg>
        </button>
      </div>
      <div className={s.scroll}>
        <nav className={s.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={`${s.navItem} ${isActive ? s.active : ""}`}
                href={item.href}
              >
                <span role="img" aria-hidden="true" className="anticon">
                  {item.icon}
                </span>
                <span className={s.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {!collapsed && vacancyItems.length > 0 && (
          <div className={s.vacancyNav}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.45)", padding: "0 8px 8px" }}>
              Мои вакансии
            </div>
            {vacancyItems.map((v) => (
              <Link
                key={v.id}
                className={s.vacancyLink}
                href={`/vacancy/${v.id}`}
                title={v.title}
              >
                {v.title}
              </Link>
            ))}
          </div>
        )}
        {!collapsed && vacancyItems.length === 0 && (
          <div className={s.vacancyNav}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.45)", padding: "0 8px" }}>
              Мои вакансии
            </div>
            <p className={s.vacancyNote}>Вы пока не ведёте вакансий</p>
          </div>
        )}
      </div>
      <div className={s.footer}>
        <button
          type="button"
          className={s.footerBtn}
          aria-label={mode === "dark" ? "Светлая тема" : "Тёмная тема"}
          onClick={toggle}
        >
          <span role="img" aria-hidden="true" className="anticon">
            {mode === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </span>
        </button>
        <span className={s.footerBtn} role="img" aria-label={`Лимиты: Вакансий: ${vacancyItems.length} из 20`} tabIndex={0}>
          <svg width="18" height="18" viewBox="0 0 18 18" className={s.ring} aria-hidden="true">
            <circle cx="9" cy="9" r="7" className={s.ringTrack} />
            <circle cx="9" cy="9" r="7" className={s.ringFill} strokeDasharray="43.98" strokeDashoffset={43.98 * (1 - vacancyItems.length / 20)} />
          </svg>
        </span>
        <Dropdown
          menu={{
            items: notifCount > 0
              ? [
                  { key: "awaiting", label: `${awaitingCount} кандидатов ждут ответа`, onClick: () => router.push("/messages") },
                  ...(unreadCount > 0 ? [{ key: "unread", label: `${unreadCount} непрочитанных уведомлений` }] : []),
                ]
              : [{ key: "empty", label: "Нет новых уведомлений", disabled: true }],
          }}
          placement="topRight"
          trigger={["click"]}
        >
          <Badge count={notifCount} size="small" offset={[-2, 2]}>
            <button aria-label="Уведомления" type="button" className={s.footerBtn}>
              <span role="img" aria-hidden="true" className="anticon">
                {ICONS.bell}
              </span>
            </button>
          </Badge>
        </Dropdown>
        <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={["click"]}>
          <button aria-label="Меню пользователя" type="button" className={s.footerBtn}>
            <span role="img" aria-hidden="true" className="anticon">
              {ICONS.user}
            </span>
          </button>
        </Dropdown>
      </div>
    </aside>
  );
}
