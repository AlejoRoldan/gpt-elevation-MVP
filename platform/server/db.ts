import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertReminder,
  users,
  userProfiles,
  consentLog,
  sessions,
  messages,
  reflections,
  crisisFlags,
  reminders,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  values.lastSignedIn = new Date();
  updateSet.lastSignedIn = new Date();

  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function completeOnboarding(userId: number, consentVersion: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    onboardingCompleted: true,
    consentVersion,
    consentTimestamp: new Date(),
  }).where(eq(users.id, userId));
}

export async function deleteUserData(userId: number) {
  const db = await getDb();
  if (!db) return;
  // Soft delete: mark as deleted and anonymize
  await db.update(users).set({
    deletedAt: new Date(),
    name: "[ELIMINADO]",
    email: null,
  }).where(eq(users.id, userId));
  // Hard delete messages and reflections
  await db.delete(messages).where(eq(messages.userId, userId));
  await db.delete(reflections).where(eq(reflections.userId, userId));
}

// ─── User Profiles ────────────────────────────────────────────────────────────
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserProfile(userId: number, data: Partial<typeof userProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserProfile(userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
}

// ─── Consent Log ─────────────────────────────────────────────────────────────
export async function logConsent(userId: number, consentType: string, granted: boolean, version: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(consentLog).values({ userId, consentType, granted, version });
}

export async function getUserConsents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consentLog)
    .where(eq(consentLog.userId, userId))
    .orderBy(desc(consentLog.timestamp));
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function createSession(userId: number, moodPre?: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(sessions).values({
    userId,
    moodPre: moodPre ?? null,
    channel: "web",
  });
  return (result[0] as any).insertId as number;
}

export async function endSession(sessionId: number, moodPost?: number) {
  const db = await getDb();
  if (!db) return;
  const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session[0]) return;
  const durationSeconds = session[0].startedAt
    ? Math.floor((Date.now() - new Date(session[0].startedAt).getTime()) / 1000)
    : null;
  await db.update(sessions).set({
    endedAt: new Date(),
    moodPost: moodPost ?? null,
    durationSeconds,
  }).where(eq(sessions.id, sessionId));
}

export async function getUserSessions(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(limit);
}

export async function updateSessionMessageCount(sessionId: number, count: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set({ messageCount: count }).where(eq(sessions.id, sessionId));
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function saveMessage(sessionId: number, userId: number, role: "user" | "assistant", content: string, tokensUsed?: number, flagged = false) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(messages).values({
    sessionId, userId, role, content, tokensUsed, flaggedForReview: flagged,
  });
  return (result[0] as any).insertId as number;
}

export async function getSessionMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt);
}

// ─── Reflections ──────────────────────────────────────────────────────────────
export async function createReflection(userId: number, content: string, title?: string, tags?: string[], sessionId?: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(reflections).values({
    userId, content, title: title ?? null, tags: tags ?? [], sessionId: sessionId ?? null,
  });
  return (result[0] as any).insertId as number;
}

export async function getUserReflections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reflections)
    .where(eq(reflections.userId, userId))
    .orderBy(desc(reflections.createdAt));
}

export async function updateReflection(id: number, userId: number, data: Partial<typeof reflections.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reflections).set(data).where(and(eq(reflections.id, id), eq(reflections.userId, userId)));
}

export async function deleteReflection(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(reflections).where(and(eq(reflections.id, id), eq(reflections.userId, userId)));
}

// ─── Crisis Flags ─────────────────────────────────────────────────────────────
export async function createCrisisFlag(sessionId: number, userId: number, severity: "low" | "medium" | "high", resourceShown: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(crisisFlags).values({ sessionId, userId, severity, resourceShown });
  await db.update(sessions).set({ crisisTriggered: true }).where(eq(sessions.id, sessionId));
}

// ─── Insights / Stats ─────────────────────────────────────────────────────────
export async function getUserInsights(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const userSessions = await db.select().from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(30);
  const userReflections = await db.select().from(reflections)
    .where(eq(reflections.userId, userId))
    .orderBy(desc(reflections.createdAt))
    .limit(50);
  return { sessions: userSessions, reflections: userReflections };
}

// ─── Export User Data ─────────────────────────────────────────────────────────
export async function exportUserData(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const profile = await getUserProfile(userId);
  const userSessions = await getUserSessions(userId, 100);
  const userReflections = await getUserReflections(userId);
  const consents = await getUserConsents(userId);
  return { user, profile, sessions: userSessions, reflections: userReflections, consents };
}

// ─── Reminders ────────────────────────────────────────────────────────────────
export async function getUserReminders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .orderBy(desc(reminders.createdAt));
}

export async function createReminder(data: InsertReminder) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(reminders).values(data).$returningId();
  return result.id;
}

export async function updateReminder(
  id: number,
  userId: number,
  data: Partial<Pick<InsertReminder, "label" | "message" | "timeOfDay" | "daysOfWeek" | "isActive" | "timezone">>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(reminders)
    .set(data)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}

export async function deleteReminder(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}

export async function getReminderById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
    .limit(1);
  return result ?? null;
}
