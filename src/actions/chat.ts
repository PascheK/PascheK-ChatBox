/**
 * @fileoverview Server Actions pour la gestion des conversations (chats)
 * Gère la création, modification, suppression et récupération des chats
 * @module ChatActions
 * @version 1.0.0
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { chats } from "@/lib/db-schema";
import { db } from "@/lib/db-config";
import { getCurrentUser } from "@/services/auth-service";
import { eq, desc, and } from "drizzle-orm";

/**
 * Génère automatiquement un titre de chat à partir du premier message utilisateur
 * @param messages - Tableau des messages de la conversation
 * @returns Titre généré ou null si aucun message utilisateur trouvé
 */
function generateChatTitle(messages: any[]): string | null {
  if (!messages || messages.length === 0) {
    return null;
  }
  
  // Chercher le premier message utilisateur
  const firstUserMessage = messages.find((msg: any) => msg.role === 'user');
  
  if (!firstUserMessage || !firstUserMessage.content) {
    return null;
  }
  
  // Prendre les 50 premiers caractères et ajouter "..." si nécessaire
  const content = firstUserMessage.content.trim();
  if (content.length <= 50) {
    return content;
  }
  
  return content.substring(0, 47) + "...";
}

/**
 * Récupère tous les chats d'un utilisateur authentifié
 * @returns Tableau des chats de l'utilisateur avec les messages formatés
 * @throws {Error} Si l'utilisateur n'est pas authentifié
 */
export async function getUserChats() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.author, user.email))
    .orderBy(desc(chats.updatedAt));

  return userChats.map(chat => ({
    ...chat,
    messages: Array.isArray(chat.messages) ? chat.messages : []
  }));
}

export async function getChat(chatId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  const chat = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.author, user.email)
      )
    )
    .limit(1);

  if (chat.length === 0) {
    return null;
  }

  return {
    ...chat[0],
    messages: Array.isArray(chat[0].messages) ? chat[0].messages : []
  };
}

export async function deleteChat(chatId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  await db
    .delete(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.author, user.email)
      )
    );

  return { success: true };
}

export async function updateChatMessages(chatId: string, messages: any[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  // Récupérer le chat actuel pour vérifier s'il a déjà un titre
  const existingChat = await db
    .select({ title: chats.title })
    .from(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.author, user.email)
      )
    )
    .limit(1);

  const updateData: {
    messages: any[];
    updatedAt: Date;
    title?: string;
  } = {
    messages: messages,
    updatedAt: new Date(),
  };

  // Si le chat n'a pas de titre et qu'il y a des messages, générer un titre
  if (existingChat.length > 0 && !existingChat[0].title && messages.length > 0) {
    const generatedTitle = generateChatTitle(messages);
    if (generatedTitle) {
      updateData.title = generatedTitle;
    }
  }

  await db
    .update(chats)
    .set(updateData)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.author, user.email)
      )
    );

  return { success: true };
}

export async function createNewChat(title?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  const chatId = crypto.randomUUID();
  
  await db
    .insert(chats)
    .values({
      id: chatId,
      author: user.email,
      messages: [],
      title: title || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  return chatId;
}

export async function createNewChatAndRedirect(title?: string) {
  const chatId = await createNewChat(title);
  redirect(`/chat/${chatId}`);
}

export async function updateChatTitle(chatId: string, newTitle: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  await db
    .update(chats)
    .set({
      title: newTitle,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.author, user.email)
      )
    );

  // Revalider les chemins pour mettre à jour la navigation et le breadcrumb
  revalidatePath("/chat");
  revalidatePath(`/chat/${chatId}`);
  revalidatePath("/");

  return { success: true };
}