// src/lib/db-schema.ts
import { InferSelectModel } from "drizzle-orm";
import { UIMessage } from "ai";
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  json,
  varchar,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core"; // pgvector
import { title } from "process";
// Si tu utilises des enums pour role, etc., tu peux les définir ici.

// ------------------------- USERS -------------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstname: text("first_name").notNull(),
  lastname: text("last_name").notNull(),
  name: text("name"),
  email: text("email").notNull().unique(), // normalise en lowercase côté code
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// ------------------------- SESSIONS (optionnel: refresh tokens) -------------------------
export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    refreshToken: text("refresh_token").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
  ]
);

export type InsertSession = typeof sessions.$inferInsert;
export type SelectSession = typeof sessions.$inferSelect;

// ------------------------- SOURCES (fichiers uploadés) -------------------------
export const sources = pgTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    path: text("path"), // si tu veux garder l’ancien champ
    storageKey: text("storage_key").notNull(), // clé exacte (MinIO/S3)
    sha256: text("sha256").notNull(), // pour dédup par user
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
  },
  (table) => [
    index("idx_sources_user_uploaded_at").on(table.userId, table.uploadedAt),
    uniqueIndex("ux_sources_user_sha256").on(table.userId, table.sha256),
  ]
);

export type InsertSource = typeof sources.$inferInsert;
export type SelectSource = typeof sources.$inferSelect;

// ------------------------- DOCUMENTS (chunks + embeddings) -------------------------
export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id")
      .references(() => sources.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    // pgvector: ajuste la dimension au modèle d'embeddings
    embedding: vector("embedding", { dimensions: 1536 }),

    // Pour citations précises / navigation
    chunkIndex: integer("chunk_index").default(0),
    charStart: integer("char_start").default(0),
    charEnd: integer("char_end").default(0),
    page: integer("page"),
    metadata: jsonb("metadata"), 
  },
  (table) => [
    // Index vectoriel HNSW (nécessite l’extension pgvector avec opclass cosine)
    index("embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops")),
    // Accès rapide aux chunks d’une source
    index("idx_documents_source_chunk").on(table.sourceId, table.chunkIndex),
  ]
);

export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocument = typeof documents.$inferSelect;

// ------------------------- CHATS -------------------------
export const chats = pgTable(
  "chats",
  {
  id: text("id").primaryKey().notNull(),
  title: text("title"),
  messages: json("messages").notNull(),
  author: varchar("author", { length: 64 })
    .notNull()
    .references(() => users.email),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(), // à mettre à jour côté code
  },
  (table) => [
    index("idx_chats_user_archived_updated").on(
      table.updatedAt
    ),
  ]
);
export type User = typeof users.$inferSelect;
export type InsertChat = typeof chats.$inferInsert;
export type SelectChat = typeof chats.$inferSelect;

export type Chat = Omit<InferSelectModel<typeof chats>, "messages"> & {
  messages: Array<UIMessage>;
};