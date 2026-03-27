import { eq } from "drizzle-orm";

import type { AdminIdentity, AppUser } from "../types/domain";
import { orm } from "./db";
import { users } from "./schema";

const mapUser = (row: typeof users.$inferSelect): AppUser => ({
  id: row.id,
  telegramUserId: row.telegramUserId,
  username: row.username,
  firstName: row.firstName,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class UsersRepository {
  ensureFromIdentity(identity: AdminIdentity) {
    if (!identity.telegramUserId) {
      throw new Error("Telegram user id is required");
    }

    const now = new Date().toISOString();

    orm
      .insert(users)
      .values({
        telegramUserId: identity.telegramUserId,
        username: identity.username ?? null,
        firstName: identity.firstName ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.telegramUserId,
        set: {
          username: identity.username ?? null,
          firstName: identity.firstName ?? null,
          updatedAt: now,
        },
      })
      .run();

    return this.getByTelegramUserId(identity.telegramUserId);
  }

  getByTelegramUserId(telegramUserId: number) {
    const row = orm.select().from(users).where(eq(users.telegramUserId, telegramUserId)).get();

    return row ? mapUser(row) : null;
  }
}

export const usersRepository = new UsersRepository();
