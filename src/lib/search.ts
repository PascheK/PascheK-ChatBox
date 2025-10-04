import { generateEmbedding } from '@/lib/embeddings';
import { documents } from './db-schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm'
import { db } from './db-config'

export async function searchDocuments(query: string, limit: number = 5, treshold: number = 0.5) {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - ( ${cosineDistance(documents.embedding, embedding)})`;
  const similarDocuments = await db.select({
    id: documents.id,
    content: documents.content,
    similarity
  })
    .from(documents)
    .where(gt(similarity, treshold))
    .orderBy(desc(similarity))
    .limit(limit);
  return similarDocuments;
}
