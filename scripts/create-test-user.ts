import { db } from "@/lib/db-config";
import { users } from "@/lib/db-schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash("test1234", 10);
    
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "killian.pasche7@gmail.com"))
      .limit(1);

    if (existingUser) {
      // eslint-disable-next-line no-console
      console.log("L'utilisateur de test existe déjà");
      return;
    }

    await db.insert(users).values({
      firstname: "Killian",
      lastname: "Pasche",
      email: "killian.pasche7@gmail.com",
      passwordHash: hashedPassword,
    });

    // eslint-disable-next-line no-console
    console.log("Utilisateur de test créé avec succès !");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Erreur lors de la création de l'utilisateur de test:", error);
  }
}

createTestUser();