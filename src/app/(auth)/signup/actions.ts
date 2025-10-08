"use server";

import { createSession } from "@/lib/session";
import { z } from "zod";
import { db } from "@/lib/db-config";
import { users } from "@/lib/db-schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const loginSchema = z
  .object({
    firstName: z.string().min(1, { message: "Le prénom est requis" }).trim(),
    lastName: z.string().min(1, { message: "Le nom est requis" }).trim(),
    email: z.email({ message: "Adresse email invalide" }).trim(),
    password: z
      .string()
      .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
      .trim(),
    confirmPassword: z
      .string()
      .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
      .trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export async function register(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }
  const { email, password, firstName, lastName } = result.data;

  try {
    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return {
        errors: {
          email: ["Un compte existe déjà avec cette adresse email"],
        },
      };
    }

    // Hasher le mot de passe avec bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer le nouvel utilisateur
    const [newUser] = await db
      .insert(users)
      .values({
        firstname: firstName,
        lastname: lastName,
        email,
        passwordHash,
        name: `${firstName} ${lastName}`.trim(),
      })
      .returning({
        id: users.id,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
      });
    
    // Créer la session
    await createSession(String(newUser.id));

    // Retourner les données utilisateur
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
      },
    };

  } catch {
    return {
      errors: {
        form: ["Une erreur est survenue. Veuillez réessayer."],
      },
    };
  }
}
