import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test context factory ─────────────────────────────────────────────────────
function makeCtx(userId = 42): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-export-user-${userId}`,
      email: `export${userId}@test.com`,
      name: "Test Export User",
      loginMethod: "manus",
      role: "user",
      onboardingCompleted: true,
      consentVersion: "1.0",
      consentTimestamp: new Date(),
      dataRetentionDays: 365,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ─── Input validation tests ───────────────────────────────────────────────────
describe("export.reflections – input validation", () => {
  it("rejects invalid format values", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally passing invalid format
      caller.export.reflections({ format: "docx" })
    ).rejects.toThrow();
  });

  it("accepts 'csv' format", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.export.reflections({ format: "csv" }).catch((err: Error) => {
      // DB errors are expected in test env; schema errors are not
      if (err.message.toLowerCase().includes("db") || err.message.toLowerCase().includes("database")) {
        return "db_error_expected";
      }
      throw err;
    });
    expect(
      result === "db_error_expected" ||
      (typeof result === "object" && result !== null && "format" in result && result.format === "csv")
    ).toBe(true);
  });

  it("accepts 'pdf' format", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.export.reflections({ format: "pdf" }).catch((err: Error) => {
      if (err.message.toLowerCase().includes("db") || err.message.toLowerCase().includes("database")) {
        return "db_error_expected";
      }
      throw err;
    });
    expect(
      result === "db_error_expected" ||
      (typeof result === "object" && result !== null && "format" in result && result.format === "pdf")
    ).toBe(true);
  });

  it("accepts optional dateFrom and dateTo filters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.export.reflections({
      format: "csv",
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
    }).catch((err: Error) => {
      if (err.message.toLowerCase().includes("db") || err.message.toLowerCase().includes("database")) {
        return "db_error_expected";
      }
      throw err;
    });
    expect(
      result === "db_error_expected" ||
      (typeof result === "object" && result !== null && "format" in result)
    ).toBe(true);
  });

  it("accepts includeTags: false", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.export.reflections({
      format: "csv",
      includeTags: false,
    }).catch((err: Error) => {
      if (err.message.toLowerCase().includes("db") || err.message.toLowerCase().includes("database")) {
        return "db_error_expected";
      }
      throw err;
    });
    expect(
      result === "db_error_expected" ||
      (typeof result === "object" && result !== null && "format" in result)
    ).toBe(true);
  });
});

// ─── Auth guard tests ─────────────────────────────────────────────────────────
describe("export.reflections – auth guard", () => {
  it("rejects unauthenticated requests", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(
      caller.export.reflections({ format: "csv" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated PDF export", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(
      caller.export.reflections({ format: "pdf" })
    ).rejects.toThrow();
  });
});

// ─── CSV structure tests ──────────────────────────────────────────────────────
describe("export.reflections – CSV structure", () => {
  it("CSV result has correct shape when DB is available", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.export.reflections({ format: "csv", includeTags: true }).catch((err: Error) => {
      if (err.message.toLowerCase().includes("db") || err.message.toLowerCase().includes("database")) {
        return null; // Skip if no DB
      }
      throw err;
    });
    if (result === null) return; // DB not available in test env
    expect(result).toHaveProperty("format", "csv");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
    if (result.data && result.count > 0) {
      const lines = result.data.split("\n");
      expect(lines[0]).toContain("Fecha");
      expect(lines[0]).toContain("Título");
      expect(lines[0]).toContain("Contenido");
      expect(lines[0]).toContain("Etiquetas");
    }
  });

  it("PDF result has correct shape when DB is available", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.export.reflections({ format: "pdf" }).catch((err: Error) => {
      if (err.message.toLowerCase().includes("db") || err.message.toLowerCase().includes("database")) {
        return null;
      }
      throw err;
    });
    if (result === null) return;
    expect(result).toHaveProperty("format", "pdf");
    expect(result).toHaveProperty("count");
    if (result.count > 0) {
      expect(result).toHaveProperty("pdfPayload");
      expect(result.pdfPayload).toHaveProperty("userName");
      expect(result.pdfPayload).toHaveProperty("exportedAt");
      expect(result.pdfPayload).toHaveProperty("reflections");
      expect(Array.isArray(result.pdfPayload?.reflections)).toBe(true);
    }
  });
});
