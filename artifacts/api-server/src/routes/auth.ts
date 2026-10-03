import { Router } from "express";
import { clearSession, createSession, requireSession } from "../lib/session.js";
import { verifyAdminPassword } from "../lib/admin-password.js";

const ADMIN_EMAIL   = "admin@aggarwalsweets.in";

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

  if (
    email.toLowerCase() === ADMIN_EMAIL &&
    await verifyAdminPassword(password)
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
