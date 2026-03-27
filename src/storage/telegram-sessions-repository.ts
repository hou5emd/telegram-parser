import { and, eq, isNotNull } from "drizzle-orm";

import { orm } from "./db";
import { telegramSessions } from "./schema";

interface TelegramSessionInput {
  ownerUserId: number;
  apiId: number;
  apiHash: string;
  phoneNumber: string | null;
  session: string | null;
  me: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;
  authorized: boolean;
}

const mapSession = (row: typeof telegramSessions.$inferSelect) => ({
  id: row.id,
  ownerUserId: row.ownerUserId,
  apiId: row.apiId,
  apiHash: row.apiHash,
  phoneNumber: row.phoneNumber,
  session: row.session,
  authorizedAt: row.authorizedAt,
  me: row.meId
    ? {
        id: row.meId,
        username: row.meUsername ?? undefined,
        firstName: row.meFirstName ?? undefined,
        lastName: row.meLastName ?? undefined,
        phone: row.mePhone ?? undefined,
      }
    : null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class TelegramSessionsRepository {
  listAuthorized() {
    return orm
      .select()
      .from(telegramSessions)
      .where(and(isNotNull(telegramSessions.authorizedAt), isNotNull(telegramSessions.session)))
      .all()
      .map(mapSession);
  }

  getByOwnerUserId(ownerUserId: number) {
    const row = orm.select().from(telegramSessions).where(eq(telegramSessions.ownerUserId, ownerUserId)).get();

    return row ? mapSession(row) : null;
  }

  save(input: TelegramSessionInput) {
    const now = new Date().toISOString();

    orm
      .insert(telegramSessions)
      .values({
        ownerUserId: input.ownerUserId,
        apiId: input.apiId,
        apiHash: input.apiHash,
        phoneNumber: input.phoneNumber,
        session: input.session,
        meId: input.me?.id ?? null,
        meUsername: input.me?.username ?? null,
        meFirstName: input.me?.firstName ?? null,
        meLastName: input.me?.lastName ?? null,
        mePhone: input.me?.phone ?? null,
        authorizedAt: input.authorized ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: telegramSessions.ownerUserId,
        set: {
          apiId: input.apiId,
          apiHash: input.apiHash,
          phoneNumber: input.phoneNumber,
          session: input.session,
          meId: input.me?.id ?? null,
          meUsername: input.me?.username ?? null,
          meFirstName: input.me?.firstName ?? null,
          meLastName: input.me?.lastName ?? null,
          mePhone: input.me?.phone ?? null,
          authorizedAt: input.authorized ? now : null,
          updatedAt: now,
        },
      })
      .run();

    return this.getByOwnerUserId(input.ownerUserId);
  }

  clear(ownerUserId: number) {
    const existing = this.getByOwnerUserId(ownerUserId);

    if (!existing) {
      return null;
    }

    return this.save({
      ownerUserId,
      apiId: existing.apiId,
      apiHash: existing.apiHash,
      phoneNumber: existing.phoneNumber,
      session: null,
      me: null,
      authorized: false,
    });
  }
}

export const telegramSessionsRepository = new TelegramSessionsRepository();
