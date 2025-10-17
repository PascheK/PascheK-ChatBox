import { db } from "@/lib/db-config";
import { documents, sources } from "@/lib/db-schema";
import { eq, and } from "drizzle-orm";

export async function ensureNotDuplicateSource(userId: number, sha256: string) {
  const [row] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.userId, userId), eq(sources.sha256, sha256)))
    .limit(1);
  return !row; // true si pas de doublon
}

export async function createSource(input: {
  userId: number;
  name: string;
  storageKey: string;
  path?: string | null;
  sha256: string;
  fileSize: number;
  mimeType: string;
}) {
  const [src] = await db
    .insert(sources)
    .values({
      userId: input.userId,
      name: input.name,
      storageKey: input.storageKey,
      path: input.path ?? null,
      sha256: input.sha256,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
    })
    .returning({ id: sources.id });
  return src.id;
}

export async function insertChunks(
  sourceId: number,
  records: Array<{
    content: string;
    embedding: number[];
    chunkIndex: number;
    charStart: number;
    charEnd: number;
    page: number | null;
    metadata: any | null;
  }>
) {
  await db.insert(documents).values(
    records.map(r => ({ sourceId, ...r }))
  );
}