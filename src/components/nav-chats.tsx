"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Plus,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { deleteChat, getUserChats } from "@/actions"

type Chat = {
  id: string;
  title?: string | null;
  author: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  messages: any[];
}

export function NavChats() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const list = await getUserChats()
      setChats(list)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    const run = async () => {
      if (user) {
        await refetch()
      } else {
        router.push("/auth/login")
      }
    }
    run()
  }, [user, pathname, refetch, router])

  const handleNewChat = async () => {
    try {
      setIsCreating(true)
      // Fallback: si pas d'API, pousse vers /chat pour laisser la page créer la conv
      router.push('/chat')
    } catch {
      // TODO: toast d'erreur
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      setIsDeleting(chatId)
      await deleteChat(chatId)
      await refetch()
      
      // Si on est sur le chat supprimé, rediriger vers /chat
      if (pathname === `/chat/${chatId}` || pathname.startsWith(`/chat/${chatId}/`)) {
        router.push('/chat')
      }
    } catch {
      // TODO: toast d'erreur
    } finally {
      setIsDeleting(null)
    }
  }

  // Fonction pour générer un titre de chat à partir du premier message
  const getChatTitle = (chat: Chat) => {
    // Si le chat a un titre défini, l'utiliser
    if (chat.title) {
      return chat.title
    }
    
    // Sinon, essayer de générer un titre à partir du premier message utilisateur
    if (chat.messages && chat.messages.length > 0) {
      const firstUserMessage = chat.messages.find((msg: any) => msg.role === 'user')
      if (firstUserMessage && firstUserMessage.content) {
        const content = firstUserMessage.content.trim()
        if (content.length <= 50) {
          return content
        }
        return content.substring(0, 47) + "..."
      }
    }
    
    // Par défaut
    return "Nouveau chat"
  }

  // Fonction pour formater la date
  const formatDate = (date: Date | string | null) => {
    if (!date) return ""
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return ""

    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Aujourd'hui"
    if (days === 1) return "Hier"
    if (days < 7) return `Il y a ${days} jours`

    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (!user) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Conversations</SidebarGroupLabel>
      
      {/* Bouton Nouveau Chat */}
      <div className="px-2 mb-2">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
          size="sm"
          disabled={isCreating}
        >
          <Plus className={`h-4 w-4 ${isCreating ? 'animate-spin' : ''}`} />
          {isCreating ? 'Création…' : 'Nouveau chat'}
        </Button>
      </div>

      {/* Liste des chats */}
      <SidebarMenu>
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <SidebarMenuItem key={i}>
              <div className="h-8 bg-gray-100 rounded-md animate-pulse mx-2" />
            </SidebarMenuItem>
          ))
        ) : chats.length === 0 ? (
          <SidebarMenuItem>
            <div className="text-center text-gray-500 py-4 px-2">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun chat</p>
            </div>
          </SidebarMenuItem>
        ) : (
          chats.map((chat) => {
            const isActive = pathname === `/chat/${chat.id}` || pathname.startsWith(`/chat/${chat.id}/`)
            
            return (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={`/chat/${chat.id}`}>
                    <MessageSquare className="h-4 w-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate text-sm font-medium">
                        {getChatTitle(chat)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
                
                {/* Menu d'actions pour chaque chat */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">Plus d'options</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem asChild>
                      <Link href={`/chat/${chat.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ouvrir le chat
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteChat(chat.id)}
                      className="text-red-600 focus:text-red-600"
                      disabled={isDeleting === chat.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting === chat.id ? 'Suppression…' : 'Supprimer'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}