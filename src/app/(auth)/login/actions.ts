"use server";

import { createSession } from "@/lib/session";
import { z } from "zod";
import { db } from "@/lib/db-config";
import { users } from "@/lib/db-schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const loginSchema = z.object({
  email: z.email({ message: "Adresse email invalide" }).trim(),
  password: z
    .string()
    .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
    .trim(),
});

export async function login(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }
  const { email, password } = result.data;

  try {
    // Chercher l'utilisateur dans la base de données
    const [existingUser] = await db
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

    if (!existingUser) {
      return {
        errors: {
          email: ["Email ou mot de passe incorrect"],
          password: ["Email ou mot de passe incorrect"],
        },
      };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
    if (!isPasswordValid) {
      return {
        errors: {
          email: ["Email ou mot de passe incorrect"],
          password: ["Email ou mot de passe incorrect"],
        },
      };
    }

    // Créer la session avec l'ID de l'utilisateur
    await createSession(existingUser.id.toString());

    // Retourner les données utilisateur (sans le mot de passe)
    return {
      success: true,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstname: existingUser.firstname,
        lastname: existingUser.lastname,
      },
    };
  } catch {
    return {
      errors: {
        email: ["Erreur lors de la connexion. Veuillez réessayer."],
      },
    };
  }
}