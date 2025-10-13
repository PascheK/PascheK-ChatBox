import { getChatById } from "@/services/chat-service";
import { notFound } from "next/navigation";
import { Chat } from "@/lib/db-schema";
import { UIMessage } from "ai";
import { Chat as ChatComponent } from "@/components/chat";

export default async function Page({ params }: { params: any }) {
  const { id } = await params;
  const chatFromDb = await getChatById({ id });

   if (!chatFromDb) {
    notFound();
  }

  // type casting
  const chat: Chat = {
    ...chatFromDb,
    messages: chatFromDb.messages as UIMessage[],
  };

  return <ChatComponent id={id} initialMessages={chat.messages || []} />;

}