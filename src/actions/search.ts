"use server"

import { db } from "@/lib/db-config"
import { chats, sources } from "@/lib/db-schema"
import { getCurrentUser } from "@/services/auth-service"
import { and, eq, ilike, or, sql } from "drizzle-orm"

/**
 * Type pour les résultats de recherche de chat
 */
export type ChatSearchResult = {
  id: string
  title: string | null
  author: string
  updatedAt: Date | null
  type: 'chat'
}

/**
 * Type pour les résultats de recherche de document
 */
export type DocumentSearchResult = {
  id: number
  name: string
  mimeType: string
  fileSize: number
  uploadedAt: Date | null
  type: 'document'
}

/**
 * Type union pour tous les résultats de recherche
 */
export type SearchResult = ChatSearchResult | DocumentSearchResult

/**
 * Recherche dans les chats et documents de l'utilisateur
 * @param query - Terme de recherche
 * @returns Tableau des résultats de recherche
 */
export async function searchChatsAndDocuments(query: string): Promise<SearchResult[]> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Non authentifié")
  }

  if (!query.trim()) {
    return []
  }

  const searchTerm = `%${query.trim()}%`

  try {
    // Recherche dans les chats (titre ou contenu des messages)
    const chatResults = await db
      .select({
        id: chats.id,
        title: chats.title,
        author: chats.author,
        updatedAt: chats.updatedAt,
        messages: chats.messages,
      })
      .from(chats)
      .where(
        or(
          // Recherche dans le titre
          ilike(chats.title, searchTerm),
          // Recherche dans les messages (cast JSON en texte)
          ilike(sql`${chats.messages}::text`, searchTerm)
        )
      )
      .limit(10)

    // Recherche dans les documents (nom du fichier)
    const docResults = await db
      .select({
        id: sources.id,
        name: sources.name,
        mimeType: sources.mimeType,
        fileSize: sources.fileSize,
        uploadedAt: sources.uploadedAt,
      })
      .from(sources)
      .where(
        and(
          eq(sources.userId, user.id),
          ilike(sources.name, searchTerm)
        )
      )
      .limit(10)

    // Formatter les résultats
    const formattedChatResults: ChatSearchResult[] = chatResults.map(chat => ({
      id: chat.id,
      title: chat.title || generateTitleFromMessages(chat.messages),
      author: chat.author,
      updatedAt: chat.updatedAt,
      type: 'chat' as const,
    }))

    const formattedDocResults: DocumentSearchResult[] = docResults.map(doc => ({
      id: doc.id,
      name: doc.name,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
      type: 'document' as const,
    }))

    // Combiner et trier par pertinence
    const allResults: SearchResult[] = [
      ...formattedChatResults,
      ...formattedDocResults,
    ]

    return allResults.slice(0, 15) // Limiter à 15 résultats au total

  } catch {
    // Erreur lors de la recherche
    return []
  }
}

/**
 * Génère un titre à partir des messages du chat
 * @param messages - Messages du chat
 * @returns Titre généré ou "Nouveau chat" par défaut
 */
function generateTitleFromMessages(messages: any): string {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return "Nouveau chat"
  }

  const firstUserMessage = messages.find((msg: any) => msg.role === 'user')
  if (firstUserMessage && firstUserMessage.content) {
    const content = firstUserMessage.content.trim()
    return content.length <= 50 ? content : content.substring(0, 47) + "..."
  }

  return "Nouveau chat"
}