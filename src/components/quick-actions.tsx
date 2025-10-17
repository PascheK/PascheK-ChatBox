"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type QuickActionsProps = {
  hasChats: boolean;
}

export function QuickActions({ hasChats }: QuickActionsProps) {
  const router = useRouter();

  async function handleNewChat() {
    try {
      const res = await fetch("/api/chats", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create chat");
      const { id } = await res.json();
      router.push(`/chat/${id}`);
      router.refresh();
    } catch {
      // TODO: afficher un toast d'erreur si tu en as un
      // console.error(e);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleNewChat}>Nouveau chat</Button>
      {hasChats && (
        <Link href="/chat" className="inline-flex">
          <Button variant="secondary">Ouvrir mes chats</Button>
        </Link>
      )}
      <Link href="/upload" className="inline-flex">
        <Button variant="outline">Uploader des documents</Button>
      </Link>
    </div>
  );
}