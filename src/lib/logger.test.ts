import { describe, it, expect, vi, afterEach } from "vitest";

describe("logger", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("logs error in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { logger } = await import("@/lib/logger");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("test");
    expect(spy).toHaveBeenCalledWith("test");
  });

  it("does not log error in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("@/lib/logger");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("test");
    expect(spy).not.toHaveBeenCalled();
  });

  it("logs warn in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { logger } = await import("@/lib/logger");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("test");
    expect(spy).toHaveBeenCalledWith("test");
  });

  it("does not log warn in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("@/lib/logger");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("test");
    expect(spy).not.toHaveBeenCalled();
  });
});
