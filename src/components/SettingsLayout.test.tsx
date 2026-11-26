// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SettingsLayout, SECTIONS } from "@/components/SettingsLayout";

describe("SettingsLayout", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders page title", () => {
    render(
      <SettingsLayout activeItem="">
        <div>content</div>
      </SettingsLayout>
    );
    expect(screen.getByText("Все настройки")).toBeTruthy();
  });

  it("renders children content", () => {
    render(
      <SettingsLayout activeItem="">
        <div>Test content</div>
      </SettingsLayout>
    );
    expect(screen.getByText("Test content")).toBeTruthy();
  });

  it("renders all section items", () => {
    render(
      <SettingsLayout activeItem="">
        <div>content</div>
      </SettingsLayout>
    );
    const allItems = SECTIONS.flatMap((s) => s.items);
    for (const item of allItems) {
      expect(screen.getByText(item.label)).toBeTruthy();
    }
  });

  it("highlights active item", () => {
    render(
      <SettingsLayout activeItem="Воронки">
        <div>content</div>
      </SettingsLayout>
    );
    const link = screen.getByText("Воронки");
    expect(link.className).toMatch(/Active/);
  });
});
