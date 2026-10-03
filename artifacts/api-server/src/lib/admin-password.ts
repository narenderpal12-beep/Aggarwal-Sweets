import { db, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_ADMIN_PASSWORD = "Admin@123";

export async function verifyAdminPassword(candidate: unknown): Promise<boolean> {
  if (typeof candidate !== "string" || candidate.length === 0) return false;

  const [setting] = await db
    .select({ value: adminSettingsTable.value })
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, "admin_password"))
    .limit(1);

  return candidate === (setting?.value ?? DEFAULT_ADMIN_PASSWORD);
}