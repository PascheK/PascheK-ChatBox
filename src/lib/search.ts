import { generateEmbedding } from "@/lib/embeddings";
import { documents, sources } from "./db-schema";
import { cosineDistance, desc, gt, sql, eq } from "drizzle-orm";
import { db } from "./db-config";

export async function searchDocuments(query: string, limit: number = 5, treshold: number = 0.5) {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - ( ${cosineDistance(documents.embedding, embedding)})`;
  const similarDocuments = await db
    .select({
      id: documents.id,
      content: documents.content,
      name: sources.name,
      path: sources.path,
      similarity,
    })
    .from(documents)
    .leftJoin(sources, eq(documents.sourceId, sources.id))
    .where(gt(similarity, treshold))
    .orderBy(desc(similarity))
    .limit(limit);
  return similarDocuments;
}
