import "server-only";

import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, type User, type UserRole } from "@/db/schema";
export { hashPassword, verifyPassword } from "@/lib/password";

const cookieName = "flowcash_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "flowcash-dev-secret-change-before-production",
);

type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
};

export async function createSession(user: Pick<User, "id" | "email" | "role" | "tenantId">) {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as Partial<SessionPayload>;

    if (!payload.userId || !payload.email || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}
