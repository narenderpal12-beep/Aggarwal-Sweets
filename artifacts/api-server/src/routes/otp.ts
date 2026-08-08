import { Router } from "express";
import { db } from "@workspace/db";
import { otpCodesTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendOtpEmail, isEmailConfigured } from "../lib/email.js";
import { randomUUID } from "node:crypto";

const router = Router();

const ADMIN_EMAIL = "admin@aggarwalsweets.in";

// POST /auth/otp/send — generate & email a 6-digit OTP
router.post("/auth/otp/send", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  if (email.toLowerCase() === ADMIN_EMAIL) {
    res.status(400).json({ error: "Use admin login for this account" });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.insert(otpCodesTable).values({
    id: randomUUID(),
    email: email.toLowerCase(),
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
  const { email, code } = req.body as { email?: string; code?: string };
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
        eq(otpCodesTable.email, email.toLowerCase()),
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

  // Mark consumed
  await db
    .update(otpCodesTable)
    .set({ used: true })
    .where(eq(otpCodesTable.id, record.id));

  res.json({ success: true, email: record.email });
});

export default router;
