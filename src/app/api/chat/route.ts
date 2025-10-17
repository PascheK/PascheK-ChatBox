import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
  type UIMessage,
  type InferUITools,
  type UIDataTypes,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { searchDocuments } from "@/lib/search";
import { getCurrentUser } from "@/lib/auth";
import {
  createMessage,
} from "@/services/chat-service";
export const dynamic = 'force-dynamic';

export type ChatTools = InferUITools<{
  searchKnowledgeBase: ReturnType<typeof tool>;
}>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  try {
    console.debug('📥 Chat API - Received request');
    const { id, messages } = await req.json();
    console.debug('📝 Chat API - Payload:', { id, messageCount: messages?.length });

    const user = await getCurrentUser();
    if (!user) {
      console.warn('🚫 Chat API - Unauthorized access attempt');
      return new Response("Unauthorized", { status: 401 });
    }
    console.debug('👤 Chat API - User authenticated:', user.email);

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        const result = streamText({
          model: openai("gpt-4o"),
          messages: convertToModelMessages(messages),
          tools: {
            searchKnowledgeBase: tool({
              description: "Search the knowledge base for relevant documents.",
              inputSchema: z.object({
                query: z.string().describe("The search query to find relevant documents."),
              }),
              execute: async ({ query }) => {
                try {
                  // eslint-disable-next-line no-console
                  console.debug('🔎 Searching documents:', { query });
                  
                  const results = await searchDocuments(query, 3, 0.5);

                  // eslint-disable-next-line no-console
                  console.debug('📚 Search results:', { 
                    count: results.length,
                    results: results.map(r => ({ id: r.id, name: r.name }))
                  });

                  if (results.length === 0) {
                    // eslint-disable-next-line no-console
                    console.debug('❌ No documents found for query:', query);
                    return {
                      content: "No relevant documents found.",
                      sources: [],
                    };
                  }

                  const sources = results.map((r) => {
                    const item = {
                      title: r.name || "Unknown source",
                      url: r.path || "",
                      sourceId: r.id.toString(),
                    };
                    // stream to UI
                    writer.write({
                      type: "source-url",
                      title: item.title,
                      url: item.url,
                      sourceId: item.sourceId,
                    });
                    return item;
                  });

                  const formattedResults = results
                    .map((r, i) => `[${i + 1}] ${r.content}`)
                    .join("\n\n");

                  return {
                    content: formattedResults,
                    sources,
                  };
                } catch (err) {
                  return {
                    content: "Error searching documents.",err,
                    sources: [],
                  };
                }
              },
            }),
          },
          system:
            "Tu es un assistant d’étude pour un élève en maturité professionnelle. Ton rôle est de l’aider à comprendre et synthétiser ses cours à partir des documents du système RAG. Sois pédagogique et bienveillant, pousse l’utilisateur à réfléchir plutôt qu’à donner la réponse directe. Résume les documents et crée des fiches de révision au format Markdown pour Obsidian (# Titre, ## Sous-titres, listes -, encadrés > 💡, etc.), en terminant par une section “🧩 Réflexion personnelle” avec 2–3 questions. Cite toujours les sources des informations (ex. (source : Chapitre 2 - Gestion.pdf)) et indique s’il n’y en a pas. Utilise un style clair, fluide, motivant et précis (200–400 mots). Comprends les requêtes comme “Fais-moi une fiche de cours sur ce document”, “Résume ce texte”, ou “Pose-moi des questions pour m’aider à comprendre”. Ton objectif est de favoriser l’apprentissage actif, la compréhension et l’autonomie intellectuelle de l’utilisateur.",
          stopWhen: stepCountIs(2),
          onFinish: async ({ text }) => {
            try {
              // eslint-disable-next-line no-console
              console.debug('✅ Chat API - Finalizing response:', { 
                messageLength: text.length,
                preview: text.substring(0, 100) + '...'
              });
              
              await createMessage({
                id,
                messages: [...messages, { role: "assistant", content: text }],
                author: user.email,
              });
              
              // eslint-disable-next-line no-console
              console.debug('💾 Chat API - Message saved to database');
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('❌ Chat API - Error saving message:', err);
              throw err; // Propager l'erreur pour la gestion globale
            }
          },
        });

        // Stream vers l'UI
        writer.merge(result.toUIMessageStream());
        // eslint-disable-next-line no-console
        console.debug('📤 Chat API - Streaming response to client');
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Chat API - Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur est survenue lors du traitement de votre requête',
        details: process.env.NODE_ENV === 'development' ? `${error}` : undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
