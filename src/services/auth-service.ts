

import { db } from "@/lib/db-config";
import { users } from "@/lib/db-schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";

export type PublicUser = {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getCurrentUser(): Promise<PublicUser | null> {
   const cookie = (await cookies()).get("session")?.value;
    if (!cookie) return null;
    try {
      const session = await decrypt(cookie);
      const userId = session?.userId;
      if (!userId) return null;
      
      // Convertir l'ID en nombre pour la requête DB
      const numericUserId = parseInt(userId as string, 10);
      if (isNaN(numericUserId)) return null;
      
      const user = await db
        .select({
          id: users.id,
          firstname: users.firstname,
          lastname: users.lastname,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, numericUserId))
        .limit(1);
      return user[0] || null;
    } catch {
      return null;
    }
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      firstname: users.firstname,
      lastname: users.lastname,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function verifyPassword(candidate: string, passwordHash: string) {
  return bcrypt.compare(candidate, passwordHash);
}

export async function hashPassword(raw: string) {
  return bcrypt.hash(raw, 10);
}

export async function createUser(input: {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      firstname: input.firstname,
      lastname: input.lastname,
      name: `${input.firstname} ${input.lastname}`.trim(),
    })
    .returning({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
      lastname: users.lastname,
    });
  return row;
}