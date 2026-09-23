import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "my-money_session";
const secret = process.env.AUTH_SECRET || process.env.MONGODB_URI || "my-money-development-secret";

function sign(value) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function createToken(userId, mode) {
  const payload = Buffer.from(JSON.stringify({ userId, mode })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expectedSignature = Buffer.from(sign(payload));
  const receivedSignature = Buffer.from(signature);
  if (receivedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(receivedSignature, expectedSignature)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function sessionCookie(userId, mode = "user") {
  return { name: COOKIE_NAME, value: createToken(userId, mode), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 };
}

export function clearSessionCookie() {
  return { name: COOKIE_NAME, value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 };
}

export function getRequestSession(request) {
  return readToken(request.cookies.get(COOKIE_NAME)?.value);
}

export async function getPageSession() {
  return readToken((await cookies()).get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME };