"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { UIMessage, useChat } from "@ai-sdk/react";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Fragment, useEffect, useState } from "react";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { useRouter } from "next/navigation";

export function Chat ({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const { status, sendMessage, messages } = useChat({
    id,
    messages: initialMessages,
    onFinish: () => {
      router.replace(`/chat/${id}`);
      router.refresh();
    },
  });
  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text) return;
    sendMessage({ text: message.text});
    setInput("");
  };
  useEffect(() => {
    // Messages updated
  }, [messages]);

  return (
    <div className="max-w-4xl w-full mx-auto p-6 relative h-[calc(100vh-73px)]">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message, index) => {
              
              if(message.role === "user") {
                 // Vérifier que message.parts existe
              if (!message.parts) {
                return null;
              }

              // Extraire toutes les sources uniques du message
              const uniqueSources = message.parts
                .filter((part) => part.type === "source-url")
                .reduce((acc: Array<{ url: string; title: string }>, part) => {
                  const existingSource = acc.find((source) => source.url === part.url);
                  if (!existingSource) {
                    acc.push({
                      url: part.url,
                      title: part.url,
                    });
                  }
                  return acc;
                }, []);

              return (
                <div key={message.id}>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            </Message>
                          </Fragment>
                        );
                      case "source-url":
                        // Ne rien retourner ici car on gère les sources après
                        return null;
                      default:
                        return null;
                    }
                  })}

                  {/* Afficher toutes les sources uniques une seule fois à la fin du message */}
                  {uniqueSources.length > 0 && (
                    <Sources>
                      <SourcesTrigger count={uniqueSources.length} />
                      <SourcesContent>
                        {uniqueSources.map((source, idx) => (
                          <Source
                            key={`${message.id}-source-${idx}`}
                            href={source.url}
                            title={source.title}
                          />
                        ))}
                      </SourcesContent>
                    </Sources>
                  )}
                </div>
              );
              }
              else if (message.role === "assistant") {
                if (!message.parts) {
                  // Render the assistant message text directly if parts is missing
                  return (
                    <div key={`${message.id}-${index}-assistant`}>
                      <Message from={message.role}>
                        <MessageContent>
                          <Response>
                            {(message as any).text || ""}
                          </Response>
                        </MessageContent>
                      </Message>
                    </div>
                  );
                }

              }
              // Si le message n'est ni "user" ni "assistant", on peut l'ignorer
              return null;             
            })}
            {(status === "submitted" || status === "streaming") && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea placeholder="Quelle sont les liaisons covalente en chimie" value={input} onChange={(e) => setInput(e.target.value)} />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
