"use client"

import {
  FileText,
  MessageSquare,
  Search as SearchIcon,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import React from "react"
import { useRouter } from "next/navigation"
import { searchChatsAndDocuments, type SearchResult } from "@/actions/search"
import { createNewChatAndRedirect } from "@/actions/chat"

export function SearchForm() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, startSearching] = React.useTransition()

  // Toggle palette with ⌘/Ctrl + J
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Debounced search
  React.useEffect(() => {
    if (!open) return
    const handle = setTimeout(() => {
      const q = query.trim()
      if (!q) {
        setResults([])
        return
      }
      startSearching(async () => {
        try {
          const r = await searchChatsAndDocuments(q)
          setResults(r)
        } catch {
          setResults([])
        }
      })
    }, 250)
    return () => clearTimeout(handle)
  }, [query, open])

  const onSelectItem = (item: SearchResult) => {
    setOpen(false)
    if (item.type === "chat") {
      router.push(`/chat/${item.id}`)
    } else {
      router.push(`/upload`)
    }
  }

  return (
    <>
      <div className="w-full sm:ml-auto sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start cursor-text bg-muted"
          onClick={() => setOpen(true)}
        >
          <SearchIcon className="mr-2 size-4" />
          <span className="text-muted-foreground text-sm">
            Appuyer sur <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none"><span className="text-xs">⌘</span>J</kbd> pour rechercher
          </span>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Rechercher un chat ou un document..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {query.trim().length === 0
              ? "Tapez pour rechercher"
              : isSearching
              ? "Recherche en cours..."
              : "Aucun résultat."}
          </CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false)
                createNewChatAndRedirect()
              }}
            >
              <Plus />
              <span>Nouveau chat</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {!!results.filter(r => r.type === "chat").length && (
            <CommandGroup heading="Chats">
              {results.filter(r => r.type === "chat").map((item) => (
                <CommandItem
                  key={`chat-${item.id}`}
                  value={(item as any).title ?? `chat-${item.id}`}
                  onSelect={() => onSelectItem(item)}
                >
                  <MessageSquare />
                  <span>{(item as any).title ?? "Nouveau chat"}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!!results.filter(r => r.type === "document").length && (
            <CommandGroup heading="Documents">
              {results.filter(r => r.type === "document").map((item) => (
                <CommandItem
                  key={`doc-${(item as any).id}`}
                  value={(item as any).name ?? `doc-${(item as any).id}`}
                  onSelect={() => onSelectItem(item)}
                >
                  <FileText />
                  <span>{(item as any).name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
