import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "tprm_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type SessionPayload = {
  userId: string;
  exp: number;
};

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env."
    );
  }
  return secret;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(payload: string): string {
  return base64url(createHmac("sha256", authSecret()).update(payload).digest());
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = { userId, exp: Date.now() + SESSION_DURATION_MS };
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as SessionPayload;
    if (typeof payload.userId !== "string" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_DURATION_MS };
