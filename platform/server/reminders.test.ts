import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test context factory ─────────────────────────────────────────────────────
function makeCtx(userId = 99): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      email: `user${userId}@test.com`,
      name: "Test User",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Input validation tests ───────────────────────────────────────────────────
describe("reminders router – input validation", () => {
  it("rejects invalid timeOfDay format", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.reminders.create({
        label: "Test",
        timeOfDay: "25:00", // invalid
        daysOfWeek: [1, 3, 5],
        timezone: "UTC",
      })
    ).rejects.toThrow();
  });

  it("rejects empty daysOfWeek array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.reminders.create({
        label: "Test",
        timeOfDay: "08:00",
        daysOfWeek: [], // must have at least 1
        timezone: "UTC",
      })
    ).rejects.toThrow();
  });

  it("rejects label exceeding 100 characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.reminders.create({
        label: "A".repeat(101),
        timeOfDay: "08:00",
        daysOfWeek: [1],
        timezone: "UTC",
      })
    ).rejects.toThrow();
  });

  it("rejects message exceeding 300 characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.reminders.create({
        label: "Test",
        message: "M".repeat(301),
        timeOfDay: "08:00",
        daysOfWeek: [1],
        timezone: "UTC",
      })
    ).rejects.toThrow();
  });

  it("rejects daysOfWeek with values outside 0-6", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.reminders.create({
        label: "Test",
        timeOfDay: "08:00",
        daysOfWeek: [7], // 7 is not a valid weekday
        timezone: "UTC",
      })
    ).rejects.toThrow();
  });

  it("accepts valid timeOfDay formats", async () => {
    // We only test schema validation here (DB call will fail in test env, which is expected)
    const caller = appRouter.createCaller(makeCtx());
    // Valid formats should pass schema validation and fail at DB level (not schema level)
    const result = await caller.reminders.create({
      label: "Pausa matutina",
      timeOfDay: "08:30",
      daysOfWeek: [1, 2, 3, 4, 5],
      timezone: "America/Bogota",
    }).catch((err: Error) => {
      // DB errors are expected in test environment; schema errors are not
      if (err.message.includes("DB not available") || err.message.includes("database")) {
        return "db_error_expected";
      }
      throw err;
    });
    // Either succeeded or got a DB error (both are acceptable in test env)
    expect(result === "db_error_expected" || (typeof result === "object" && "success" in result)).toBe(true);
  });

  it("accepts all 7 days of week", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.reminders.create({
      label: "Diario",
      timeOfDay: "21:00",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      timezone: "UTC",
    }).catch((err: Error) => {
      if (err.message.includes("DB not available") || err.message.includes("database")) {
        return "db_error_expected";
      }
      throw err;
    });
    expect(result === "db_error_expected" || (typeof result === "object" && "success" in result)).toBe(true);
  });
});

// ─── Update validation tests ──────────────────────────────────────────────────
describe("reminders router – update validation", () => {
  it("rejects invalid timeOfDay in update", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.reminders.update({ id: 1, timeOfDay: "99:99" })
    ).rejects.toThrow();
  });

  it("accepts partial updates (only isActive)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.reminders.update({ id: 1, isActive: false }).catch((err: Error) => {
      if (err.message.includes("DB not available") || err.message.includes("database")) {
        return "db_error_expected";
      }
      throw err;
    });
    expect(result === "db_error_expected" || (typeof result === "object" && "success" in result)).toBe(true);
  });
});

// ─── Delete validation tests ──────────────────────────────────────────────────
describe("reminders router – delete validation", () => {
  it("requires a numeric id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally passing wrong type
      caller.reminders.delete({ id: "not-a-number" })
    ).rejects.toThrow();
  });
});

// ─── Auth guard tests ─────────────────────────────────────────────────────────
describe("reminders router – auth guard", () => {
  it("rejects unauthenticated requests to list", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(caller.reminders.list()).rejects.toThrow();
  });

  it("rejects unauthenticated requests to create", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(
      caller.reminders.create({
        label: "Test",
        timeOfDay: "08:00",
        daysOfWeek: [1],
        timezone: "UTC",
      })
    ).rejects.toThrow();
  });
});
