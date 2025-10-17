import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getChat } from '@/actions/chat'

export function useChatTitle() {
  const [chatTitle, setChatTitle] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Vérifier si on est sur une page de chat avec un ID
    const chatMatch = pathname.match(/^\/chat\/([^/]+)/)
    if (!chatMatch) {
      setChatTitle(null)
      return
    }

    const chatId = chatMatch[1]
    
    // Ne pas essayer de récupérer le titre pour les nouveaux chats sans ID
    if (chatId === 'new' || chatId.length < 5) {
      setChatTitle("Nouveau chat")
      return
    }

    async function fetchChatTitle() {
      try {
        const chat = await getChat(chatId)
        if (chat) {
          // Utiliser le titre s'il existe, sinon générer à partir du premier message
          if (chat.title) {
            setChatTitle(chat.title)
          } else if (chat.messages && chat.messages.length > 0) {
            const firstUserMessage = chat.messages.find((msg: any) => msg.role === 'user')
            if (firstUserMessage && firstUserMessage.content) {
              const content = firstUserMessage.content.trim()
              setChatTitle(content.length <= 50 ? content : content.substring(0, 47) + "...")
            } else {
              setChatTitle("Nouveau chat")
            }
          } else {
            setChatTitle("Nouveau chat")
          }
        } else {
          setChatTitle(null)
        }
      } catch {
        // Erreur lors de la récupération du titre du chat
        setChatTitle(null)
      }
    }

    fetchChatTitle()
  }, [pathname])

  return chatTitle
}