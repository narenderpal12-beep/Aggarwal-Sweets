import { Router } from "express";
import { db, customersTable } from "@workspace/db";
import { otpCodesTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendOtpEmail, isEmailConfigured } from "../lib/email.js";
import { randomUUID } from "node:crypto";
import { createSession } from "../lib/session.js";

const router = Router();

const ADMIN_EMAIL = "admin@aggarwalsweets.in";

// POST /auth/otp/send — generate & email a 6-digit OTP
router.post("/auth/otp/send", async (req, res) => {
  const submittedEmail = (req.body as { email?: unknown } | null)?.email;
  const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  if (email === ADMIN_EMAIL) {
    res.status(400).json({ error: "Use admin login for this account" });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.insert(otpCodesTable).values({
    id: randomUUID(),
    email,
    code,
    expiresAt,
  });

  if (isEmailConfigured()) {
    try {
      await sendOtpEmail(email, code);
    } catch (err: any) {
      console.error("Failed to send OTP email:", err?.message ?? err);
      // Still return success — the OTP is saved and can be verified.
      // The caller can check console logs in dev; in prod the admin should fix credentials.
      res.status(500).json({ error: "Could not send email. Please check Gmail credentials or try again." });
      return;
    }
  } else {
    // Dev fallback — log to console so it's still usable without email config
    console.info(`[dev] OTP for ${email}: ${code}`);
  }

  res.json({ success: true });
});

// POST /auth/otp/verify — verify code, return success + email
router.post("/auth/otp/verify", async (req, res) => {
  const { email: submittedEmail, code } = req.body as { email?: string; code?: string };
  const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase() : "";
  if (!email || !code) {
    res.status(400).json({ error: "Email and code required" });
    return;
  }

  const now = new Date();
  const [record] = await db
    .select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.email, email),
        eq(otpCodesTable.code, code.trim()),
        eq(otpCodesTable.used, false),
        gt(otpCodesTable.expiresAt, now)
      )
    )
    .limit(1);

  if (!record) {
    res.status(401).json({ error: "Incorrect or expired OTP. Please try again." });
    return;
  }

  await db.transaction(async transaction => {
    await transaction
      .update(otpCodesTable)
      .set({ used: true })
      .where(eq(otpCodesTable.id, record.id));
    await transaction
      .insert(customersTable)
      .values({ email: record.email })
      .onConflictDoNothing();
  });

  createSession(res, record.email, "customer");
  res.json({ success: true, email: record.email });
});

export default router;
