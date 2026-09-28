import { Router } from "express";
import { db, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { clearSession, createSession, requireSession } from "../lib/session.js";

const ADMIN_EMAIL   = "admin@aggarwalsweets.in";
const DEFAULT_ADMIN_PASSWORD = "Admin@123";

const router = Router();

router.get("/auth/admin/session", (req, res) => {
  const session = requireSession(req, res, "admin");
  if (!session) return;
  res.json({ email: session.email, role: session.role });
});

// Server-side admin credential check — never exposes the stored password
router.post("/auth/admin", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ success: false, error: "email and password required" });
    return;
  }

  const [row] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, "admin_password"))
    .limit(1);

  const storedPassword = row?.value ?? DEFAULT_ADMIN_PASSWORD;

  if (
    email.toLowerCase() === ADMIN_EMAIL &&
    password === storedPassword
  ) {
    createSession(res, ADMIN_EMAIL, "admin");
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid credentials" });
  }
});

router.post("/auth/logout", (_req, res) => {
  clearSession(res);
  res.json({ success: true });
});

export default router;
