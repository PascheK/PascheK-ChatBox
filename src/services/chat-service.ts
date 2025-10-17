// src/services/chat-service.ts
import { db } from '@/lib/db-config';
import { chats } from '@/lib/db-schema';
import { eq, desc } from 'drizzle-orm';

export type ChatListItem = {
  id: string;
  title: string | null;
  updatedAt: Date | null;
  messages: any;
};

export type ChatMessage = {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date | null;
  sources?: string | null;   // si tu l’utilises encore
  citations?: any | null;    // jsonb
};



export async function createMessage({
  id,
  messages,
  author,
}: {
  id: string;
  messages: any;
  author: string;
}) {
  const selectedChats = await db.select().from(chats).where(eq(chats.id, id));

  if (selectedChats.length > 0) {
    return await db
      .update(chats)
      .set({
        messages: JSON.stringify(messages),
      })
      .where(eq(chats.id, id));
  }

  return await db.insert(chats).values({
    id,
    createdAt: new Date(),
    messages: JSON.stringify(messages),
    author,
  });
}

export async function getChatsByUser({ email }: { email: string }): Promise<ChatListItem[]> {
  try {
    const userChats = await db
      .select({
        id: chats.id,
        updatedAt: chats.updatedAt,
        messages: chats.messages,
      })
      .from(chats)
      .where(eq(chats.author, email))
      .orderBy(desc(chats.updatedAt));

    return userChats.map(chat => ({
      id: chat.id,
      title: null, // Pas de colonne title dans le schéma
      updatedAt: chat.updatedAt,
      messages: chat.messages,
    }));
  } catch {
    // Error handled silently
    return [];
  }
}

export async function getChatById({ id }: { id: string }) {
  const [selectedChat] = await db.select().from(chats).where(eq(chats.id, id));
  return selectedChat;
}