import { eq } from "drizzle-orm";

import { orm } from "./db";
import { settings } from "./schema";

export class SettingsRepository {
  get(key: string) {
    const row = orm.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).get();

    return row?.value ?? null;
  }

  set(key: string, value: string) {
    orm
      .insert(settings)
      .values({ key, value, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date().toISOString() } })
      .run();
  }

  delete(key: string) {
    orm.delete(settings).where(eq(settings.key, key)).run();
  }
}

export const settingsRepository = new SettingsRepository();
