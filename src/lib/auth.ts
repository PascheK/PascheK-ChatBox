'use server'
import { decrypt } from "./session";
import { cookies } from "next/headers";
import { db } from "./db-config";

import { users } from "@/lib/db-schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
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


