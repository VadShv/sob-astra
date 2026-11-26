// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePageTitle } from "@/components/usePageTitle";

describe("usePageTitle", () => {
  afterEach(() => {
    document.title = "";
  });

  it("sets document title with suffix", () => {
    renderHook(() => usePageTitle("Test Page"));
    expect(document.title).toBe("Test Page — Собесо");
  });

  it("updates title on re-render", () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: "First" },
    });
    expect(document.title).toBe("First — Собесо");

    rerender({ title: "Second" });
    expect(document.title).toBe("Second — Собесо");
  });
});
