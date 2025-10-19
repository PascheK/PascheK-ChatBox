

import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db-config";
import { chats, sources } from "@/lib/db-schema";
import { desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/services/auth-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/components/quick-actions";
  export const dynamic = 'force-dynamic'; // ⚠️⚠️⚠️ THIS IS REQUIRED TO ENSURE PAGE IS DYNAMIC, NOT PRE-BUILT

// ---------- Helpers ----------
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number | null | undefined) {
  const n = typeof bytes === "number" ? bytes : 0;
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"]; 
  const i = Math.floor(Math.log(n) / Math.log(k));
  const val = (n / Math.pow(k, i)).toFixed(1);
  return `${val} ${sizes[i]}`;
}

// ---------- Page (Server Component) ----------
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Stats: nombre de chats, nombre de documents, taille totale
  const [{ count: chatCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(chats)
    .where(eq(chats.author, user.email));

  const [{ count: docCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sources)
    .where(eq(sources.userId, user.id));

  const [{ totalSize }] = await db
    .select({ totalSize: sql<number>`COALESCE(SUM(${sources.fileSize}), 0)` })
    .from(sources)
    .where(eq(sources.userId, user.id));

  // Derniers chats (5)
  const recentChats = await db
    .select({ id: chats.id, title: chats.title, updatedAt: chats.updatedAt })
    .from(chats)
    .where(eq(chats.author, user.email))
    .orderBy(desc(chats.updatedAt))
    .limit(5);

  // Derniers documents (5)
  const recentDocs = await db
    .select({
      id: sources.id,
      name: sources.name,
      uploadedAt: sources.uploadedAt,
      fileSize: sources.fileSize,
      mimeType: sources.mimeType,
    })
    .from(sources)
    .where(eq(sources.userId, user.id))
    .orderBy(desc(sources.uploadedAt))
    .limit(5);

  const hasChats = recentChats.length > 0;
  const lastChat = recentChats[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm">
            Bonjour {user.firstname ?? user.email}, voici un aperçu de votre activité.
          </p>
        </div>
        <QuickActions hasChats={hasChats} />
      </header>

      {/* Stats */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chatCount}</div>
            {lastChat && (
              <div className="text-xs text-muted-foreground mt-1">
                Dernière activité : {formatDate(lastChat.updatedAt)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{docCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Espace utilisé: {formatBytes(totalSize)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Action rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {hasChats && lastChat ? (
                <Link href={`/chat/${lastChat.id}`} className="inline-flex">
                  <Button variant="secondary">Continuer le dernier chat</Button>
                </Link>
              ) : (
                <Link href="/chat" className="inline-flex">
                  <Button variant="secondary">Ouvrir le chat</Button>
                </Link>
              )}
              <Link href="/upload" className="inline-flex">
                <Button variant="outline">Voir mes documents</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Listes */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chats récents</CardTitle>
          </CardHeader>
          <CardContent>
            {recentChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune conversation pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {recentChats.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <div>
                      <Link href={`/chat/${c.id}`} className="font-medium hover:underline">
                        {c.title ?? "New Chat"}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        Mis à jour: {formatDate(c.updatedAt)}
                      </div>
                    </div>
                    <Link href={`/chat/${c.id}`} className="inline-flex">
                      <Button size="sm" variant="outline">Ouvrir</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents récents</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun document importé pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {recentDocs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.mimeType ?? "document"} · {formatBytes(d.fileSize)} · {formatDate(d.uploadedAt)}
                      </div>
                    </div>
                    <Link href="/upload" className="inline-flex">
                      <Button size="sm" variant="outline">Gérer</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}