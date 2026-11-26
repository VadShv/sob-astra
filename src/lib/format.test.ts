import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatNumber,
  formatCurrency,
  formatPercent,
  getGreeting,
  getInitials,
} from "@/lib/format";

describe("formatDate", () => {
  it("formats ISO string to ru_RU date", () => {
    expect(formatDate("2026-01-15T10:00:00Z")).toMatch(/15\.01\.2026/);
  });

  it("formats Date object", () => {
    expect(formatDate(new Date(2026, 0, 15))).toMatch(/15\.01\.2026/);
  });

  it("accepts custom options", () => {
    const result = formatDate("2026-01-15T10:00:00Z", { month: "long" });
    expect(result).toContain("январ");
  });
});

describe("formatDateTime", () => {
  it("formats to ru_RU date+time", () => {
    const result = formatDateTime("2026-01-15T10:30:00Z");
    expect(result).toMatch(/15\.01\.2026/);
  });
});

describe("formatRelative", () => {
  it("returns 'только что' for recent", () => {
    expect(formatRelative(new Date())).toBe("только что");
  });

  it("returns minutes for < 1h", () => {
    const d = new Date(Date.now() - 5 * 60000);
    expect(formatRelative(d)).toBe("5 мин назад");
  });

  it("returns hours for < 24h", () => {
    const d = new Date(Date.now() - 3 * 3600000);
    expect(formatRelative(d)).toBe("3 ч назад");
  });

  it("returns days for < 7d", () => {
    const d = new Date(Date.now() - 2 * 86400000);
    expect(formatRelative(d)).toBe("2 дн назад");
  });

  it("returns formatted date for >= 7d", () => {
    const d = new Date(Date.now() - 10 * 86400000);
    expect(formatRelative(d)).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});

describe("formatNumber", () => {
  it("formats with ru_RU separators", () => {
    expect(formatNumber(1000000)).toMatch(/1.000.000/);
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatCurrency", () => {
  it("formats RUB by default", () => {
    expect(formatCurrency(50000)).toMatch(/50.000/);
  });

  it("accepts custom currency", () => {
    expect(formatCurrency(100, "USD")).toContain("100");
  });
});

describe("formatPercent", () => {
  it("converts decimal to percent", () => {
    expect(formatPercent(0.15)).toBe("15%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("handles 1", () => {
    expect(formatPercent(1)).toBe("100%");
  });
});

describe("getGreeting", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns a non-empty string", () => {
    vi.setSystemTime(new Date(2026, 0, 1, 12));
    expect(getGreeting()).toBeTruthy();
  });

  it("returns morning greeting at 8am", () => {
    vi.setSystemTime(new Date(2026, 0, 1, 8));
    expect(getGreeting()).toBe("доброе утро!");
  });

  it("returns evening greeting at 20:00", () => {
    vi.setSystemTime(new Date(2026, 0, 1, 20));
    expect(getGreeting()).toBe("добрый вечер!");
  });
});

describe("getInitials", () => {
  it("returns uppercase initials", () => {
    expect(getInitials("Иван", "Петров")).toBe("ИП");
  });

  it("handles missing names", () => {
    expect(getInitials()).toBe("");
  });

  it("handles single name", () => {
    expect(getInitials("Иван")).toBe("И");
  });
});
