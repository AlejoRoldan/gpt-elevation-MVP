/**
 * In-memory user store for preview/development mode.
 *
 * Used when DATABASE_URL is not configured. Data is lost on server restart.
 * This is intentional — it allows the platform to run without a database
 * for local development and UI preview purposes.
 *
 * In production, all operations go through the real MySQL database.
 */

import { decryptEmail, isEncryptedEmail } from "./emailEncryption";

export interface MemoryUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  passwordHash: string | null;
  loginMethod: string | null;
  role: string;
  lastSignedIn: Date;
}

class MemoryUserStore {
  private users: Map<string, MemoryUser> = new Map(); // key: openId
  private nextId = 1;

  isEnabled(): boolean {
    return !process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "";
  }

  findByOpenId(openId: string): MemoryUser | null {
    return this.users.get(openId) ?? null;
  }

  findByEmail(email: string): MemoryUser | null {
    const allUsers = Array.from(this.users.values());
    return allUsers.find(u => {
      if (!u.email) return false;
      try {
        const decrypted = isEncryptedEmail(u.email) ? decryptEmail(u.email) : u.email;
        return decrypted === email;
      } catch {
        return false;
      }
    }) ?? null;
  }

  create(data: Omit<MemoryUser, "id">): MemoryUser {
    const user: MemoryUser = { ...data, id: this.nextId++ };
    this.users.set(user.openId, user);
    return user;
  }

  updateLastSignedIn(openId: string): void {
    const user = this.users.get(openId);
    if (user) user.lastSignedIn = new Date();
  }

  count(): number {
    return this.users.size;
  }
}

export const memoryStore = new MemoryUserStore();
