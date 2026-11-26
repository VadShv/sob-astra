import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("logs error in development", () => {
    process.env.NODE_ENV = "development";
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("test");
    expect(spy).toHaveBeenCalledWith("test");
  });

  it("does not log error in production", () => {
    process.env.NODE_ENV = "production";
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("test");
    expect(spy).not.toHaveBeenCalled();
  });

  it("logs warn in development", () => {
    process.env.NODE_ENV = "development";
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("test");
    expect(spy).toHaveBeenCalledWith("test");
  });

  it("does not log warn in production", () => {
    process.env.NODE_ENV = "production";
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("test");
    expect(spy).not.toHaveBeenCalled();
  });
});
