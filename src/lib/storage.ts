import { randomUUID } from "crypto";
import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false, // ou true si HTTPS activé
  accessKey: process.env.MINIO_ACCESS_KEY || "admin",
  secretKey: process.env.MINIO_SECRET_KEY || "supersecretpassword",
});

// ---------------------------------------------------------
// 📤 UPLOAD FILE
// ---------------------------------------------------------
/**
 * Upload un fichier vers un bucket MinIO
 * @param bucketName Nom du bucket (ex: "uploads")
 * @param file Fichier à uploader (type File ou Buffer)
 * @param contentType Type MIME (ex: "image/png")
 * @returns URL publique du fichier
 */
export async function uploadFile(
  bucketName: string,
  file: File | Buffer,
  contentType: string
): Promise<string> {
  const objectName = `${file instanceof File ? file.name : "file"}`;
  if (await fileExists(bucketName, objectName)) return "";
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  // Vérifie que le bucket existe
  const exists = await minioClient.bucketExists(bucketName).catch(() => false);
  if (!exists) await minioClient.makeBucket(bucketName);

  // Upload vers MinIO
  await minioClient.putObject(bucketName, objectName, buffer);

  // URL publique
  const url = `${process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`}/${bucketName}/${objectName}`;

  return url;
}

// ---------------------------------------------------------
// GET FILE
// ---------------------------------------------------------
/**
 * Récupère un fichier depuis MinIO
 * @param bucketName Nom du bucket
 * @param objectName Nom de l’objet (fichier)
 * @returns Buffer du fichier
 */
export async function getFile(bucketName: string, objectName: string): Promise<Buffer> {
  const stream = await minioClient.getObject(bucketName, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// ---------------------------------------------------------
// DELETE FILE
// ---------------------------------------------------------
/**
 * Supprime un fichier d’un bucket
 * @param bucketName Nom du bucket
 * @param objectName Nom du fichier
 */
export async function deleteFile(bucketName: string, objectName: string) {
  await minioClient.removeObject(bucketName, objectName);
}

// ---------------------------------------------------------
// CHECK FILE
// ---------------------------------------------------------
/**
 * Vérifie si un fichier existe dans un bucket MinIO
 * @param bucketName Nom du bucket
 * @param objectName Nom du fichier
 * @returns true si le fichier existe, false sinon
 */
export async function fileExists(bucketName: string, objectName: string): Promise<boolean> {
  try {
    await minioClient.statObject(bucketName, objectName);
    return true;
  } catch {
    return false;
  }
}
