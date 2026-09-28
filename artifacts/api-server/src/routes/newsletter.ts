import { Router } from "express";
import { isEmailConfigured, sendNewsletterContactEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";

const router = Router();
const recentEmailSubmissions = new Map<string, number>();
const submissionCooldownMs = 60_000;

router.post("/newsletter", async (req, res) => {
  const body = req.body && typeof req.body === "object"
    ? req.body as { name?: unknown; email?: unknown; mobile?: unknown; message?: unknown; company?: unknown }
    : {};

  // Quietly accept honeypot submissions without sending mail.
  if (typeof body.company === "string" && body.company.trim()) {
    res.status(202).json({ success: true });
    return;
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const mobileDigits = mobile.replace(/\D/g, "");

  if (!name || name.length > 100) {
    res.status(400).json({ error: "Enter your name (up to 100 characters)." });
    return;
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (mobile.length > 24 || !/^[+\d\s().-]+$/.test(mobile) || mobileDigits.length < 7 || mobileDigits.length > 15) {
    res.status(400).json({ error: "Enter a valid mobile number." });
    return;
  }
  if (!message || message.length > 1000) {
    res.status(400).json({ error: "Enter a message (up to 1,000 characters)." });
    return;
  }

  if (!isEmailConfigured()) {
    res.status(503).json({ error: "Email notifications are temporarily unavailable." });
    return;
  }

  const now = Date.now();
  for (const [submittedEmail, submittedAt] of recentEmailSubmissions) {
    if (now - submittedAt >= submissionCooldownMs) {
      recentEmailSubmissions.delete(submittedEmail);
    }
  }

  const emailKey = email.toLowerCase();
  const lastSubmission = recentEmailSubmissions.get(emailKey);
  if (lastSubmission && now - lastSubmission < submissionCooldownMs) {
    res.status(429).json({ error: "Please wait a little before submitting again." });
    return;
  }

  recentEmailSubmissions.set(emailKey, now);
  try {
    await sendNewsletterContactEmail({ name, email, mobile, message });
    res.status(200).json({ success: true });
  } catch (error) {
    recentEmailSubmissions.delete(emailKey);
    logger.error({ err: error }, "Newsletter contact email failed");
    res.status(502).json({ error: "We could not send your request right now. Please try again shortly." });
  }
});

export default router;