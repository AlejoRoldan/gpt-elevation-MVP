import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB and LLM ─────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    endSession: vi.fn().mockResolvedValue(undefined),
    getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Alejo", email: "alejo@test.com" }),
    getUserReflections: vi.fn().mockResolvedValue([]),
    getUserSessions: vi.fn().mockResolvedValue([]),
    getUserInsights: vi.fn().mockResolvedValue({ totalSessions: 5, avgMoodPre: 3.2, avgMoodPost: 3.8, moodTrend: [] }),
    getUserConsents: vi.fn().mockResolvedValue([]),
    getUserProfile: vi.fn().mockResolvedValue(null),
    upsertUserProfile: vi.fn().mockResolvedValue(undefined),
    logConsent: vi.fn().mockResolvedValue(undefined),
    completeOnboarding: vi.fn().mockResolvedValue(undefined),
    exportUserData: vi.fn().mockResolvedValue({ user: {}, sessions: [], reflections: [], consents: [] }),
    deleteUserData: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(42),
    saveMessage: vi.fn().mockResolvedValue(1),
    getSessionMessages: vi.fn().mockResolvedValue([]),
    updateSessionMessageCount: vi.fn().mockResolvedValue(undefined),
    createCrisisFlag: vi.fn().mockResolvedValue(undefined),
    createReflection: vi.fn().mockResolvedValue(1),
    updateReflection: vi.fn().mockResolvedValue(undefined),
    deleteReflection: vi.fn().mockResolvedValue(undefined),
    getUserReminders: vi.fn().mockResolvedValue([]),
    createReminder: vi.fn().mockResolvedValue(1),
    updateReminder: vi.fn().mockResolvedValue(undefined),
    deleteReminder: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: "Gracias por este tiempo contigo mismo. Lo que emergió hoy tiene su propio valor.",
      },
    }],
  }),
}));

// ─── Test context ─────────────────────────────────────────────────────────────
function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@elevation.app",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("sessionClose.close", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns closingPhrase, moodPre, moodPost and moodDelta", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessionClose.close({
      sessionId: 42,
      moodPost: 4,
      moodPre: 2,
      messageCount: 8,
      topThemes: ["ansiedad", "trabajo"],
    });

    expect(result.closingPhrase).toBeTruthy();
    expect(typeof result.closingPhrase).toBe("string");
    expect(result.moodPre).toBe(2);
    expect(result.moodPost).toBe(4);
    expect(result.moodDelta).toBe(2);
    expect(result.messageCount).toBe(8);
    expect(result.sessionId).toBe(42);
  });

  it("calculates moodDelta correctly when mood improves", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessionClose.close({
      sessionId: 1,
      moodPost: 5,
      moodPre: 1,
      messageCount: 3,
    });

    expect(result.moodDelta).toBe(4);
  });

  it("calculates moodDelta correctly when mood stays the same", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessionClose.close({
      sessionId: 2,
      moodPost: 3,
      moodPre: 3,
      messageCount: 5,
    });

    expect(result.moodDelta).toBe(0);
  });

  it("calculates moodDelta correctly when mood decreases", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessionClose.close({
      sessionId: 3,
      moodPost: 2,
      moodPre: 4,
      messageCount: 10,
    });

    expect(result.moodDelta).toBe(-2);
  });

  it("returns null moodDelta when moodPre is not provided", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessionClose.close({
      sessionId: 4,
      moodPost: 4,
      messageCount: 2,
    });

    expect(result.moodPre).toBeNull();
    expect(result.moodDelta).toBeNull();
  });

  it("uses fallback phrase when LLM fails", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("LLM unavailable"));

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessionClose.close({
      sessionId: 5,
      moodPost: 3,
      messageCount: 0,
    });

    expect(result.closingPhrase).toBeTruthy();
    expect(result.closingPhrase.length).toBeGreaterThan(10);
  });

  it("accepts topThemes array and includes them in context", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessionClose.close({
      sessionId: 6,
      moodPost: 4,
      moodPre: 3,
      messageCount: 6,
      topThemes: ["familia", "identidad", "relaciones"],
    });

    expect(result).toBeDefined();
    expect(result.closingPhrase).toBeTruthy();
  });

  it("validates moodPost is between 1 and 5", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sessionClose.close({
        sessionId: 7,
        moodPost: 6 as number, // out of range
        messageCount: 0,
      })
    ).rejects.toThrow();
  });

  it("validates sessionId is a positive integer", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sessionClose.close({
        sessionId: -1,
        moodPost: 3,
        messageCount: 0,
      })
    ).rejects.toThrow();
  });
});
