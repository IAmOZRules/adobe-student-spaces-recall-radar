import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "rr_admin_token";

function expectedToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  return crypto.createHmac("sha256", password).update("recall-radar-admin-session").digest("hex");
}

export function tokenForPassword(password: string): string | null {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return null;
  const a = Buffer.from(password);
  const b = Buffer.from(real);
  const same = a.length === b.length && crypto.timingSafeEqual(a, b);
  return same ? expectedToken() : null;
}

export async function isAdminRequest(): Promise<boolean> {
  try {
    const store = await cookies();
    const cookie = store.get(ADMIN_COOKIE)?.value;
    if (!cookie) return false;
    const expected = expectedToken();
    const a = Buffer.from(cookie);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
