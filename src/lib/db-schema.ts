import { pgTable, serial, text, vector, index, integer, timestamp } from "drizzle-orm/pg-core";

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path"),
  type: text("type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id").references(() => sources.id),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [index("embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops"))]
);

export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocument = typeof documents.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstname: text("first_name").notNull(),
  lastname: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  refreshToken: text("refresh_token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").default("New Chat"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  sources: text("sources"), // JSON list of sources (e.g. ["file1.ts", "report.pdf"])
  createdAt: timestamp("created_at").defaultNow(),
});
