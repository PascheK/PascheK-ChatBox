import { randomUUID } from "crypto";
import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false, // ou true si HTTPS activé
  accessKey: process.env.MINIO_ACCESS_KEY || "admin",
  secretKey: process.env.MINIO_SECRET_KEY || "supersecretpassword",
});

// Utilitaire : nettoie un nom de fichier pour un object key sûr
function sanitizeName(name: string) {
  return name
    .trim()
    .replace(/[/\\]/g, "-")        // pas de slashs
    .replace(/\s+/g, "-")          // espaces -> tirets
    .replace(/[^a-zA-Z0-9._-]/g, "-") // caractères exotiques
    .replace(/-+/g, "-");          // tirets multiples
}

function buildBaseUrl() {
  const explicit = process.env.MINIO_PUBLIC_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const useSSL = String(process.env.MINIO_USE_SSL || "").toLowerCase() === "true" || false;
  const scheme = useSSL ? "https" : "http";
  const host = process.env.MINIO_ENDPOINT || "localhost";
  const port = process.env.MINIO_PORT || "9000";
  return `${scheme}://${host}:${port}`;
}

export function buildPublicUrl(bucketName: string, storageKey: string) {
  const base = buildBaseUrl();
  return `${base}/${bucketName}/${storageKey}`;
}

// ---------------------------------------------------------
// 📤 UPLOAD FILE
// ---------------------------------------------------------
/**
 * Upload un fichier vers un bucket MinIO
 * @param bucketName Nom du bucket (ex: "uploads")
 * @param file Fichier à uploader (type File ou Buffer)
 * @param contentType Type MIME (ex: "application/pdf")
 * @param opts Options facultatives: { userId?: string; storageKey?: string; preferredName?: string }
 * @returns URL publique du fichier (utilisez `buildPublicUrl` si vous avez déjà la storageKey)
 */
export async function uploadFile(
  bucketName: string,
  file: File | Buffer,
  contentType: string,
  opts?: { userId?: string; storageKey?: string; preferredName?: string }
): Promise<string> {
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  // Vérifie que le bucket existe
  const exists = await minioClient.bucketExists(bucketName).catch(() => false);
  if (!exists) await minioClient.makeBucket(bucketName);

  // Détermine une storageKey robuste
  const baseName = sanitizeName(
    opts?.preferredName ?? (file instanceof File ? file.name : "file")
  );
  const prefix = opts?.userId ? `${opts.userId}/` : "";
  const storageKey = opts?.storageKey ?? `${prefix}${randomUUID()}-${baseName}`;

  // Upload vers MinIO (avec metadata content-type)
  await minioClient.putObject(bucketName, storageKey, buffer, {
    "Content-Type": contentType || "application/octet-stream",
  } as any);

  // URL publique
  return buildPublicUrl(bucketName, storageKey);
}

// ---------------------------------------------------------
// GET LIST OF FILES
// ---------------------------------------------------------
/**
 * Récupère une liste des fichiers selon un user
 * @param bucketName Nom du bucket
 * @param userId ID de l’utilisateur
 * @returns Liste des fichiers
 */
export async function listFiles(
  bucketName: string,
  userId: string
): Promise<Array<{ name: string; url: string }>> {
  const prefix = userId ? `${userId}/` : "";
  const stream = minioClient.listObjectsV2(bucketName, prefix, true);
  const results: Array<{ name: string; url: string }> = [];

  return new Promise((resolve, reject) => {
    stream.on("data", (obj: any) => {
      if (!obj?.name) return;
      results.push({
        name: obj.name,
        url: buildPublicUrl(bucketName, obj.name),
      });
    });
    stream.on("error", (err: any) => reject(err));
    stream.on("end", () => resolve(results));
  });
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
 * Supprime un fichier d’un bucket (via sa storageKey)
 * @param bucketName Nom du bucket
 * @param objectName storageKey (ex: "userId/uuid-filename.pdf")
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
