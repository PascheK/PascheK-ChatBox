'use client'

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation"
import { useChat } from "@ai-sdk/react"
import { Loader } from "@/components/ai-elements/loader"
import { Message, MessageContent } from "@/components/ai-elements/message"
import { PromptInput, PromptInputBody, PromptInputMessage, PromptInputSubmit, PromptInputTextarea, PromptInputToolbar, PromptInputTools } from "@/components/ai-elements/prompt-input"
import { Response } from "@/components/ai-elements/response"
import { Fragment, useState } from "react"

export default function RAGChatBot() {
  const [input, setInput] = useState("")
  const { status, sendMessage, messages } = useChat();
  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text) return;
    sendMessage({ text: message.text });
    setInput("");
  }
  return (
    <div className='max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh-4rem)]'>
      <div className="flex flex-col h-full">
        <Conversation className="h-full" >
          <ConversationContent >
            {
              messages.map((message) => (
                <div key={message.id} >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                        </Fragment>
                      default:
                        return null
                    }
                  })}
                </div>
              ))
            }
            {(status === 'submitted' || status === 'streaming') && <Loader />}
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
  )
}
