import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  logConsent: vi.fn().mockResolvedValue(undefined),
  upsertUserProfile: vi.fn().mockResolvedValue(undefined),
  completeOnboarding: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Test User", email: "test@test.com", consentVersion: "1.0" }),
  getUserProfile: vi.fn().mockResolvedValue({ communicationStyle: "empathetic" }),
  getUserConsents: vi.fn().mockResolvedValue([]),
  getUserSessions: vi.fn().mockResolvedValue([]),
  getUserReflections: vi.fn().mockResolvedValue([]),
  getUserInsights: vi.fn().mockResolvedValue({ sessions: [], reflections: [] }),
  createSession: vi.fn().mockResolvedValue(42),
  endSession: vi.fn().mockResolvedValue(undefined),
  getSessionMessages: vi.fn().mockResolvedValue([]),
  saveMessage: vi.fn().mockResolvedValue(1),
  updateSessionMessageCount: vi.fn().mockResolvedValue(undefined),
  createReflection: vi.fn().mockResolvedValue(1),
  updateReflection: vi.fn().mockResolvedValue(undefined),
  deleteReflection: vi.fn().mockResolvedValue(undefined),
  exportUserData: vi.fn().mockResolvedValue({ user: {}, profile: {}, sessions: [], reflections: [], consents: [] }),
  deleteUserData: vi.fn().mockResolvedValue(undefined),
  createCrisisFlag: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Estoy aquí contigo." } }],
    usage: { total_tokens: 100 },
  }),
}));

import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";

function createMockContext(overrides: Partial<TrpcContext> = {}): TrpcContext {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      email: "test@elevation.app",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
    ...overrides,
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns the current user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@elevation.app");
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const ctx = createMockContext({
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true });
  });
});

// ─── Onboarding Tests ─────────────────────────────────────────────────────────
describe("onboarding", () => {
  it("completes onboarding with all consents", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.onboarding.complete({
      consents: {
        privacy_policy: true,
        ai_interaction: true,
        session_data: true,
        insights: false,
        notifications: false,
      },
      communicationStyle: "empathetic",
      personalGoals: "Quiero explorar mis emociones.",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Chat Tests ───────────────────────────────────────────────────────────────
describe("chat", () => {
  it("starts a session and returns sessionId", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.startSession({ moodPre: 3 });
    expect(result.sessionId).toBe(42);
  });

  it("sends a normal message and gets a response", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.sendMessage({
      sessionId: 1,
      message: "Me siento un poco ansioso hoy.",
    });
    expect(result.response).toBeTruthy();
    expect(result.crisis).toBe(false);
  });

  it("detects high-severity crisis keywords", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.sendMessage({
      sessionId: 1,
      message: "Estoy pensando en suicidarme.",
    });
    expect(result.crisis).toBe(true);
    expect(result.crisisResource).toBeTruthy();
    expect(result.response).toContain("Línea de crisis");
  });

  it("ends a session with mood post", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.endSession({ sessionId: 1, moodPost: 4 });
    expect(result.success).toBe(true);
  });
});

// ─── Reflections Tests ────────────────────────────────────────────────────────
describe("reflections", () => {
  it("creates a reflection with tags", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reflections.create({
      content: "Hoy me di cuenta de que el miedo me paraliza.",
      title: "Sobre el miedo",
      tags: ["ansiedad", "crecimiento"],
    });
    expect(result.id).toBe(1);
  });

  it("lists reflections", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reflections.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Profile Tests ────────────────────────────────────────────────────────────
describe("profile", () => {
  it("gets profile data", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.get();
    expect(result.user).toBeTruthy();
  });

  it("updates consent", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.updateConsent({ consentType: "notifications", granted: true });
    expect(result.success).toBe(true);
  });
});

// ─── Insights Tests ───────────────────────────────────────────────────────────
describe("insights", () => {
  it("returns insights data", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.insights.get();
    expect(result).toHaveProperty("sessions");
    expect(result).toHaveProperty("reflections");
  });
});
