"use server";

import { getCurrentUser } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/storage";
import { createHash } from "node:crypto";
import * as pdfLib from "pdf-parse";
const pdf = (pdfLib as any).default ?? (pdfLib as any);
import { chunkContent } from "@/lib/chunking";
import { generateEmbeddings } from "@/lib/embeddings";
import { db } from "@/lib/db-config";
import { documents, sources } from "@/lib/db-schema";
import { eq, and } from "drizzle-orm";
import {
  ensureNotDuplicateSource,
  createSource,
  insertChunks,
} from "@/services/upload-service";

export async function processPdfFile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const file = formData.get("pdf") as File | null;
  if (!file) return { success: false, error: "No file uploaded." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer);
  if (!data.text?.trim()) return { success: false, error: "PDF vide." };

  const sha256 = createHash("sha256").update(buffer).digest("hex");
  if (!(await ensureNotDuplicateSource(user.id, sha256))) {
    return { success: false, error: "Ce fichier a déjà été importé." };
  }

  const bucket = process.env.MINIO_BUCKET_NAME || "paschek-gpt";
  const publicUrl = await uploadFile(bucket, file, file.type, {
    userId: String(user.id),
    preferredName: file.name,
  });
  const storageKey = publicUrl.split("/").slice(-1)[0] ?? publicUrl;

  const sourceId = await createSource({
    userId: user.id,
    name: file.name,
    storageKey,
    path: publicUrl,
    sha256,
    fileSize: Number(file.size) || buffer.length,
    mimeType: file.type,
  });

  const chunkItems = await chunkContent(data.text);
  const texts = chunkItems.map((c: any) => (typeof c === "string" ? c : c.content));
  const embeddings = await generateEmbeddings(texts);

  await insertChunks(
    sourceId,
    chunkItems.map((c: any, i: number) => ({
      content: texts[i],
      embedding: embeddings[i],
      chunkIndex: typeof c === "string" ? i : c.chunkIndex ?? i,
      charStart: typeof c === "string" ? 0 : c.start ?? 0,
      charEnd:
        typeof c === "string"
          ? texts[i]?.length ?? 0
          : c.end ?? texts[i]?.length ?? 0,
      page: typeof c === "string" ? null : c.page ?? null,
      metadata: typeof c === "string" ? null : c.metadata ?? null,
    }))
  );

  return { success: true };
}

export async function getMyDocuments() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] as any[] };

  const rows = await db
    .select({
      id: sources.id,
      name: sources.name,
      uploadedAt: sources.uploadedAt,
      fileSize: sources.fileSize,
      mimeType: sources.mimeType,
    })
    .from(sources)
    .where(and(eq(sources.userId, user.id)));

  return { success: true, data: rows };
}

export async function deleteDocument(sourceId: number) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [row] = await db
    .select({
      id: sources.id,
      userId: sources.userId,
      storageKey: sources.storageKey,
    })
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);

  if (!row) return { success: false, error: "Source not found" };
  if (row.userId !== user.id) return { success: false, error: "Forbidden" };

  await db.delete(documents).where(eq(documents.sourceId, sourceId));
  await db.delete(sources).where(eq(sources.id, sourceId));

  if (row.storageKey) {
    await deleteFile(process.env.MINIO_BUCKET_NAME || "paschek-gpt", row.storageKey);
  }
  return { success: true };
}