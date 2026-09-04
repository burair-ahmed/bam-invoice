import { DEFAULT_PIN, SESSION_COOKIE } from "./constants";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function expectedPin(): string {
  return process.env.STAFF_PIN || DEFAULT_PIN;
}

export function isPinValid(pin: string): boolean {
  const expected = expectedPin();
  if (pin.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= pin.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return ok === 0;
}

export function sessionCookieValue(): string {
  return process.env.SESSION_SECRET || "local-demo-session";
}

export function buildSessionCookie(): string {
  return `${SESSION_COOKIE}=${sessionCookieValue()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function hasValidSession(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (!found) return false;
  const value = found.slice(SESSION_COOKIE.length + 1);
  return value === sessionCookieValue();
}
