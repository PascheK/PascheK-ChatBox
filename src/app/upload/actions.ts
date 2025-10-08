"use server";

import { pdf } from "pdf-parse";
import { minioClient } from "@/lib/storage";
import { randomUUID } from "crypto";
import { uploadFile } from "@/lib/storage";
import { db } from "@/lib/db-config";
import { documents, sources } from "@/lib/db-schema";
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";

export async function processPdfFile(formData: FormData) {
  try {
    const file = formData.get("pdf") as File;

    if (!file) return { success: false, error: "No file uploaded." };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return {
        success: false,
        error: "The PDF file is empty or contains no extractable text.",
      };
    }

    const path = await uploadFile(process.env.MINIO_BUCKET_NAME || "paschek-gpt", file, file.type);
    if (!path.match("")) return { success: false, error: "File already exists." };
    const source = {
      name: file.name,
      path,
      type: file.type,
      url: path,
    };
    const sourceId = await db.insert(sources).values(source).returning({ id: documents.id });

    const chunks = await chunkContent(data.text);

    const embeddings = await generateEmbeddings(chunks);
    const records = chunks.map((chunk, index) => ({
      content: chunk,
      embedding: embeddings[index],
      sourceId: sourceId[0].id,
    }));
    await db.insert(documents).values(records);

    return { success: true, message: `Created ${records.length} searchable chunks` };
  } catch (error) {
    console.error("Error processing PDF file:", error);
    return {
      success: false,
      error: "Failed to process PDF file.",
    };
  }
}
