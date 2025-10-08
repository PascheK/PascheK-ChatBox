"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useChat } from "@ai-sdk/react";
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

export default function RAGChatBot() {
  const [input, setInput] = useState("");
  const { status, sendMessage, messages } = useChat();
  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => {
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
            })}
            {(status === "submitted" || status === "streaming") && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea value={input} onChange={(e) => setInput(e.target.value)} />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <p>test</p>
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
