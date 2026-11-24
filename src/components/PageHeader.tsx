import { type ReactNode } from "react";
import s from "./page-header.module.css";

export function PageHeader({
  title,
  sub,
  actions,
  panel = true,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  panel?: boolean;
}) {
  return (
    <header className={s.head} data-panel={panel ? "" : undefined}>
      <div className={s.top}>
        <div className={s.titleBox}>
          <h1 className={s.title}>{title}</h1>
          {sub && <p className={s.sub}>{sub}</p>}
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
      </div>
    </header>
  );
}
