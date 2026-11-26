// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PageHeader } from "@/components/PageHeader";

describe("PageHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders title", () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText("Test Title")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    render(<PageHeader title="Title" sub="Subtitle text" />);
    expect(screen.getByText("Subtitle text")).toBeTruthy();
  });

  it("does not render subtitle when not provided", () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByText("Subtitle")).toBeNull();
  });

  it("renders actions when provided", () => {
    render(<PageHeader title="Title" actions={<button>Action</button>} />);
    expect(screen.getByText("Action")).toBeTruthy();
  });
});
