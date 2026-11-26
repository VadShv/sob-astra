// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ErrorState } from "@/components/ErrorState";

describe("ErrorState", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders error message", () => {
    render(<ErrorState />);
    expect(screen.getByText("Не удалось загрузить данные")).toBeTruthy();
  });

  it("renders retry text when onRetry provided", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByText("Повторить")).toBeTruthy();
  });

  it("does not render retry text when onRetry not provided", () => {
    render(<ErrorState />);
    expect(screen.queryByText("Повторить")).toBeNull();
  });
});
