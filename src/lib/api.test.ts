import { describe, it, expect, vi } from "vitest";
import axios from "axios";
import { parseApiError } from "@/lib/api";

describe("parseApiError", () => {
  it("extracts message from axios error", () => {
    const error = {
      isAxiosError: true,
      response: { status: 400, data: { message: "Неверный формат" } },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    expect(parseApiError(error)).toBe("Неверный формат");
  });

  it("returns auth message for 401", () => {
    const error = {
      isAxiosError: true,
      response: { status: 401, data: {} },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    expect(parseApiError(error)).toBe("Необходима авторизация");
  });

  it("returns forbidden message for 403", () => {
    const error = {
      isAxiosError: true,
      response: { status: 403, data: {} },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    expect(parseApiError(error)).toBe("Недостаточно прав");
  });

  it("returns not found message for 404", () => {
    const error = {
      isAxiosError: true,
      response: { status: 404, data: {} },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    expect(parseApiError(error)).toBe("Не найдено");
  });

  it("returns rate limit message for 429", () => {
    const error = {
      isAxiosError: true,
      response: { status: 429, data: {} },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    expect(parseApiError(error)).toBe("Слишком много запросов");
  });

  it("returns server error message for 500", () => {
    const error = {
      isAxiosError: true,
      response: { status: 500, data: {} },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    expect(parseApiError(error)).toBe("Ошибка сервера");
  });

  it("returns server error message for 502", () => {
    const error = {
      isAxiosError: true,
      response: { status: 502, data: {} },
    };
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    expect(parseApiError(error)).toBe("Ошибка сервера");
  });

  it("returns generic message for non-axios error", () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false);
    expect(parseApiError(new Error("boom"))).toBe("Произошла ошибка");
  });

  it("returns generic message for null", () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false);
    expect(parseApiError(null)).toBe("Произошла ошибка");
  });
});
