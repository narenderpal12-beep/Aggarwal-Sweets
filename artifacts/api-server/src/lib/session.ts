import type { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";

type SessionRole = "admin" | "customer";
type SessionPayload = {
  email: string;
  role: SessionRole;
  expiresAt: number;
};

const COOKIE_NAME = "aggarwal_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required to create authenticated sessions");
  return secret;
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function cookieValue(req: Request, name: string) {
  return req.headers.cookie
    ?.split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function createSession(res: Response, email: string, role: SessionRole) {
  const payload: SessionPayload = {
    email: email.toLowerCase(),
    role,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${signature(encoded)}`;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}; Path=/; HttpOnly; SameSite=Lax`,
  );
}

export function getSession(req: Request): SessionPayload | null {
  const token = cookieValue(req, COOKIE_NAME);
  if (!token) return null;
  const [encoded, tokenSignature] = token.split(".");
  if (!encoded || !tokenSignature) return null;
  const expectedSignature = signature(encoded);
  const received = Buffer.from(tokenSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.email || !payload.role || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireSession(req: Request, res: Response, role?: SessionRole) {
  const session = getSession(req);
  if (!session || (role && session.role !== role)) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return session;
}