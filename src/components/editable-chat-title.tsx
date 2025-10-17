"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Check, X } from 'lucide-react'
import { updateChatTitle } from '@/actions/chat'
import { useRouter } from 'next/navigation'

type EditableChatTitleProps = {
  chatId: string
  title: string
  onTitleUpdate?: (newTitle: string) => void
}

export function EditableChatTitle({ chatId, title, onTitleUpdate }: EditableChatTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!editedTitle.trim() || editedTitle === title) {
      setIsEditing(false)
      setEditedTitle(title)
      return
    }

    setIsLoading(true)
    try {
      await updateChatTitle(chatId, editedTitle.trim())
      onTitleUpdate?.(editedTitle.trim())
      setIsEditing(false)
      router.refresh() // Rafraîchir la page pour mettre à jour les données
    } catch {
      // Erreur: remettre l'ancien titre
      setEditedTitle(title)
      setIsEditing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditedTitle(title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 max-w-xs">
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-sm font-medium">{title}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  )
}