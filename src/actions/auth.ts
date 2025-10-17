/**
 * @fileoverview Server Actions pour l'authentification utilisateur
 * Gère l'inscription, la connexion et la déconnexion des utilisateurs
 * @module AuthActions
 * @version 1.0.0
 */


"use server";

import bcrypt from "bcrypt";

console.log("🧠 [Auth Action] Chargement du module bcrypt :", typeof bcrypt.hash);
console.log("🔑 [Auth Action] SESSION_SECRET présent :", !!process.env.SESSION_SECRET);
console.log("🌐 [Auth Action] DATABASE_URL présent :", !!process.env.DATABASE_URL);

try {
  const testHash = bcrypt.hashSync("debug-test", 10);
  const testCompare = bcrypt.compareSync("debug-test", testHash);
  console.log("✅ [Auth Action] Bcrypt test réussi :", testCompare);
} catch (err) {
  console.error("❌ [Auth Action] Erreur Bcrypt :", err);
}

import { createSession, clearSession } from "@/lib/session";
import { z } from "zod";
import {
  normalizeEmail,
  findUserByEmail,
  createUser,
  verifyPassword,
} from "@/services/auth-service";

/**
 * Schéma de validation pour l'inscription d'un nouvel utilisateur
 * Valide les champs requis et s'assure que les mots de passe correspondent
 */
const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "Le prénom est requis" }).trim(),
    lastName: z.string().min(1, { message: "Le nom est requis" }).trim(),
    email: z.string().email({ message: "Adresse email invalide" }).trim(),
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

/**
 * Server Action pour l'inscription d'un nouvel utilisateur
 * @param prevState - État précédent du formulaire (pour useActionState)
 * @param formData - Données du formulaire d'inscription
 * @returns Objet contenant soit les erreurs de validation soit les données utilisateur
 */
export async function register(prevState: any, formData: FormData) {
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }
  const { email, password, firstName, lastName } = result.data;

  try {
    const emailNorm = await normalizeEmail(email);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await findUserByEmail(emailNorm);
    if (existingUser) {
      return {
        errors: { email: ["Un compte existe déjà avec cette adresse email"] },
      };
    }

    // Créer le nouvel utilisateur (hash interne au service)
    const newUser = await createUser({
      email: emailNorm,
      password,
      firstname: firstName,
      lastname: lastName,
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

/**
 * Schéma de validation pour la connexion utilisateur
 */
const loginSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }).trim(),
  password: z
    .string()
    .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
    .trim(),
});

/**
 * Server Action pour la connexion d'un utilisateur existant
 * @param prevState - État précédent du formulaire (pour useActionState)
 * @param formData - Données du formulaire de connexion
 * @returns Objet contenant soit les erreurs de validation soit les données utilisateur
 */
export async function login(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }
  const { email, password } = result.data;

  try {
    const emailNorm = await normalizeEmail(email);

    // Chercher l'utilisateur dans la base de données
    const existingUser = await findUserByEmail(emailNorm);
    if (!existingUser) {
      return {
        errors: {
          email: ["Email ou mot de passe incorrect"],
          password: ["Email ou mot de passe incorrect"],
        },
      };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(password, existingUser.passwordHash);
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

/**
 * Server Action pour la déconnexion d'un utilisateur
 * Supprime la session utilisateur et redirige vers la page d'accueil
 * @returns Objet indiquant le succès de l'opération
 */
export async function logout() {
  await clearSession();
  return { success: true };
}