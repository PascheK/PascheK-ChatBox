import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage, type InferUITools, type UIDataTypes } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from "zod";
import { searchDocuments } from "@/lib/search";

const tools = {
  searchKnowledgeBase: tool({
    description: "Search the knowledge base for relevant documents.",
    inputSchema: z.object({
      query: z.string().describe("The search query to find relevant documents."),
    }),
    execute: async ({ query }) => {
      try {
        const results = await searchDocuments(query, 3, 0.5);
        if (results.length === 0) {
          return "No relevant documents found.";
        }
        const formattedResults = results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
        return formattedResults;
      }
      catch (err) {
        console.error("Error searching documents:", err);
        return "Error searching documents.";
      }
    },
  })
}

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json()
    const result = streamText({
      model: openai("gpt-4o"),
      messages: convertToModelMessages(messages),
      tools,
      system: "Tu es un assistant d’étude pour un élève en maturité professionnelle. Ton rôle est de l’aider à comprendre et synthétiser ses cours à partir des documents du système RAG. Sois pédagogique et bienveillant, pousse l’utilisateur à réfléchir plutôt qu’à donner la réponse directe. Résume les documents et crée des fiches de révision au format Markdown pour Obsidian (# Titre, ## Sous-titres, listes -, encadrés > 💡, etc.), en terminant par une section “🧩 Réflexion personnelle” avec 2–3 questions. Cite toujours les sources des informations (ex. (source : Chapitre 2 - Gestion.pdf)) et indique s’il n’y en a pas. Utilise un style clair, fluide, motivant et précis (200–400 mots). Comprends les requêtes comme “Fais-moi une fiche de cours sur ce document”, “Résume ce texte”, ou “Pose-moi des questions pour m’aider à comprendre”. Ton objectif est de favoriser l’apprentissage actif, la compréhension et l’autonomie intellectuelle de l’utilisateur.",
      stopWhen: stepCountIs(2),
    })
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming chat response:", error);
    return new Response("Failed to stream chat completion", { status: 500 });
  }

}