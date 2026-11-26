import { describe, it, expect } from "vitest";
import { qk } from "@/lib/query-keys";

describe("query keys factory", () => {
  describe("auth", () => {
    it("me", () => {
      expect(qk.auth.me()).toEqual(["auth-me"]);
    });
    it("user", () => {
      expect(qk.auth.user()).toEqual(["user"]);
    });
  });

  describe("vacancies", () => {
    it("active with params", () => {
      expect(qk.vacancies.active("active", 1, 20, "title", "asc")).toEqual([
        "vacancies-active", "active", 1, 20, "title", "asc",
      ]);
    });
    it("sidebar", () => {
      expect(qk.vacancies.sidebar()).toEqual(["sidebar-vacancies"]);
    });
    it("detail", () => {
      expect(qk.vacancies.detail("123")).toEqual(["vacancy", "123"]);
    });
    it("all returns prefix", () => {
      expect(qk.vacancies.all()).toEqual(["vacancies-active"]);
    });
  });

  describe("candidates", () => {
    it("list with params", () => {
      expect(qk.candidates.list("dev", ["hh"], ["senior"], "recent", 1, 20)).toEqual([
        "candidates", "dev", ["hh"], ["senior"], "recent", 1, 20,
      ]);
    });
    it("all returns prefix", () => {
      expect(qk.candidates.all()).toEqual(["candidates"]);
    });
    it("detail", () => {
      expect(qk.candidates.detail("c1")).toEqual(["candidate", "c1"]);
    });
  });

  describe("conversations", () => {
    it("awaiting with params", () => {
      expect(qk.conversations.awaiting("active", true, ["email"], 1, 20)).toEqual([
        "conversations-awaiting", "active", true, ["email"], 1, 20,
      ]);
    });
    it("messages", () => {
      expect(qk.conversations.messages("c1")).toEqual(["conversation-messages", "c1"]);
    });
  });

  describe("analytics", () => {
    it("kpi with params", () => {
      expect(qk.analytics.kpi("month", "r1", "v1")).toEqual(["hiring-kpi", "month", "r1", "v1"]);
    });
    it("exportLog", () => {
      expect(qk.analytics.exportLog()).toEqual(["export-log"]);
    });
  });

  describe("reference", () => {
    it("dictionary", () => {
      expect(qk.reference.dictionary("grades")).toEqual(["reference-grades"]);
    });
    it("orgUnits", () => {
      expect(qk.reference.orgUnits()).toEqual(["org-units"]);
    });
  });

  describe("settings", () => {
    it("company", () => {
      expect(qk.settings.company()).toEqual(["company"]);
    });
    it("funnels", () => {
      expect(qk.settings.funnels()).toEqual(["funnel-templates"]);
    });
    it("twoFaStatus", () => {
      expect(qk.settings.twoFaStatus()).toEqual(["2fa-status"]);
    });
  });
});
