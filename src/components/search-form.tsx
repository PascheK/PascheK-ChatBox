"use client"

import {
  FileText,
  MessageSquare,
  Search as SearchIcon,
  Plus,
  Clock,
  Filter,
  X,
  Calendar,
  FileType,
  Hash,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronRight,
  User,
  Bot,
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import React from "react"
import { useRouter } from "next/navigation"
import { searchChatsAndDocuments, type SearchResult } from "@/actions/search"
import { createNewChatAndRedirect } from "@/actions/chat"

type FilterOptions = {
  types: ('chat' | 'document')[]
  dateRange: 'all' | 'today' | 'week' | 'month'
  fileTypes: string[]
}

type SearchHistoryItem = {
  id: string
  query: string
  timestamp: number
  resultsCount: number
}

const STORAGE_KEY = 'search-history'
const RECENT_SEARCHES_KEY = 'recent-searches'

export function SearchForm() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, startSearching] = React.useTransition()
  const [showFilters, setShowFilters] = React.useState(false)
  const [searchHistory, setSearchHistory] = React.useState<SearchHistoryItem[]>([])
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  
  const [filters, setFilters] = React.useState<FilterOptions>({
    types: ['chat', 'document'],
    dateRange: 'all',
    fileTypes: []
  })

  // Load search history from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSearchHistory(JSON.parse(stored))
      }
      
      const recentStored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (recentStored) {
        setRecentSearches(JSON.parse(recentStored))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Enhanced keyboard shortcuts
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // ⌘/Ctrl + J to toggle
      if (e.key.toLowerCase() === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      
      // ⌘/Ctrl + K to toggle (alternative)
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      
      // ESC to close
      if (e.key === "Escape" && open) {
        e.preventDefault()
        setOpen(false)
      }
      
      // Handle arrow navigation when open
      if (open && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          )
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        }
        if (e.key === "Enter" && selectedIndex >= 0) {
          e.preventDefault()
          onSelectItem(results[selectedIndex])
        }
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, results, selectedIndex])

  // Save to search history
  const saveSearchHistory = React.useCallback((searchQuery: string, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: searchQuery,
      timestamp: Date.now(),
      resultsCount: resultCount
    }
    
    try {
      const updated = [newItem, ...searchHistory.filter(h => h.query !== searchQuery)].slice(0, 10)
      setSearchHistory(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
      // Update recent searches
      const recentUpdated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
      setRecentSearches(recentUpdated)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentUpdated))
    } catch {
      // Ignore localStorage errors
    }
  }, [searchHistory, recentSearches])

  // Advanced filtering function
  const filterResults = React.useCallback((rawResults: SearchResult[]) => {
    let filtered = rawResults

    // Filter by type
    if (filters.types.length < 2) {
      filtered = filtered.filter(r => filters.types.includes(r.type))
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0)
          break
        case 'week':
          cutoff.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoff.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(r => {
        const date = r.type === 'chat' 
          ? (r as any).updatedAt 
          : (r as any).uploadedAt
        return date && new Date(date) >= cutoff
      })
    }

    // Filter by file types for documents
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(r => {
        if (r.type !== 'document') return true
        const doc = r as any
        return filters.fileTypes.some(type => 
          doc.mimeType?.includes(type) || doc.name?.toLowerCase().includes(type)
        )
      })
    }

    return filtered
  }, [filters])

  // Enhanced debounced search with filters
  React.useEffect(() => {
    if (!open) {
      setSelectedIndex(-1)
      return
    }
    
    const handle = setTimeout(() => {
      const q = query.trim()
      if (!q) {
        setResults([])
        setSelectedIndex(-1)
        return
      }
      
      startSearching(async () => {
        try {
          const rawResults = await searchChatsAndDocuments(q)
          const filteredResults = filterResults(rawResults)
          setResults(filteredResults)
          setSelectedIndex(-1)
          
          // Save to history if we got results
          if (filteredResults.length > 0) {
            saveSearchHistory(q, filteredResults.length)
          }
        } catch {
          setResults([])
          setSelectedIndex(-1)
        }
      })
    }, 300)
    
    return () => clearTimeout(handle)
  }, [query, open, filters, filterResults, saveSearchHistory])

  const onSelectItem = (item: SearchResult) => {
    setOpen(false)
    setQuery("")
    setSelectedIndex(-1)
    
    if (item.type === "chat") {
      router.push(`/chat/${item.id}`)
    } else {
      router.push(`/upload#doc-${item.id}`)
    }
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    setRecentSearches([])
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore localStorage errors
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'chat') {
      return <MessageSquare className="h-4 w-4" />
    }
    
    const doc = result as any
    if (doc.mimeType?.includes('pdf')) return <FileText className="h-4 w-4" />
    if (doc.mimeType?.includes('image')) return <FileType className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getResultPreview = (result: SearchResult) => {
    if (result.type === 'chat') {
      const chat = result as any
      return chat.author ? `Par ${chat.author}` : 'Chat personnel'
    }
    
    const doc = result as any
    return doc.fileSize ? formatFileSize(doc.fileSize) : 'Document'
  }

  return (
    <>
      <div className="w-full sm:ml-auto sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start cursor-text bg-muted hover:bg-muted/80 transition-colors group relative"
          onClick={() => setOpen(true)}
        >
          <SearchIcon className="mr-2 size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">
            Recherche avancée...
          </span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="bg-muted-foreground/10 text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-70 select-none group-hover:opacity-100 transition-opacity">
              <span className="text-xs">⌘</span>J
            </kbd>
          </div>
          {recentSearches.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] bg-blue-500 text-white border-0"
            >
              {recentSearches.length}
            </Badge>
          )}
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false} className="max-w-2xl">
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Recherche intelligente dans vos chats et documents..."
            value={query}
            onValueChange={setQuery}
            className="flex h-10 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex items-center gap-1 ml-2">
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Filter className="h-4 w-4" />
                  {(filters.types.length < 2 || filters.dateRange !== 'all' || filters.fileTypes.length > 0) && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Type de contenu</h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="chat-filter"
                          checked={filters.types.includes('chat')}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({
                              ...prev,
                              types: checked 
                                ? [...prev.types.filter(t => t !== 'chat'), 'chat']
                                : prev.types.filter(t => t !== 'chat')
                            }))
                          }
                        />
                        <Label htmlFor="chat-filter" className="text-sm">Chats</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="doc-filter"
                          checked={filters.types.includes('document')}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({
                              ...prev,
                              types: checked 
                                ? [...prev.types.filter(t => t !== 'document'), 'document']
                                : prev.types.filter(t => t !== 'document')
                            }))
                          }
                        />
                        <Label htmlFor="doc-filter" className="text-sm">Documents</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Période</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'all', label: 'Tout' },
                        { key: 'today', label: 'Aujourd\'hui' },
                        { key: 'week', label: '7 derniers jours' },
                        { key: 'month', label: '30 derniers jours' },
                      ].map((option) => (
                        <Button
                          key={option.key}
                          variant={filters.dateRange === option.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilters(prev => ({ ...prev, dateRange: option.key as any }))}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({
                        types: ['chat', 'document'],
                        dateRange: 'all',
                        fileTypes: []
                      })}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {(searchHistory.length > 0 || recentSearches.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={clearSearchHistory}
                title="Effacer l'historique"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="py-6 text-center">
            <div className="flex flex-col items-center gap-2">
              {query.trim().length === 0 ? (
                <>
                  <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm text-muted-foreground">Commencez à taper pour rechercher</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Utilisez les filtres pour affiner vos résultats
                    </p>
                  </div>
                </>
              ) : isSearching ? (
                <>
                  <div className="animate-spin h-6 w-6 border-2 border-muted-foreground/20 border-t-foreground rounded-full" />
                  <p className="text-sm text-muted-foreground">Recherche en cours...</p>
                </>
              ) : (
                <>
                  <SearchIcon className="h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Essayez d'autres mots-clés ou ajustez vos filtres
                    </p>
                  </div>
                </>
              )}
            </div>
          </CommandEmpty>

          {query.trim().length === 0 && recentSearches.length > 0 && (
            <CommandGroup heading="🕐 Recherches récentes">
              {recentSearches.slice(0, 3).map((search, index) => (
                <CommandItem
                  key={`recent-${index}`}
                  value={search}
                  onSelect={() => setQuery(search)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{search}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {query.trim().length === 0 && (
            <>
              <CommandGroup heading="⚡ Actions rapides">
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    createNewChatAndRedirect()
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Nouveau chat</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Ctrl+N</Badge>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    router.push('/upload')
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Gérer les documents</span>
                </CommandItem>
              </CommandGroup>
              
              {searchHistory.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="📊 Historique détaillé">
                    {searchHistory.slice(0, 3).map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.query}
                        onSelect={() => setQuery(item.query)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <span>{item.query}</span>
                            <p className="text-xs text-muted-foreground">
                              {item.resultsCount} résultat(s) • {formatRelativeTime(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {query.trim().length > 0 && results.length > 0 && (
            <CommandSeparator />
          )}

          {!!results.filter(r => r.type === "chat").length && (
            <CommandGroup heading={`💬 Conversations (${results.filter(r => r.type === "chat").length})`}>
              {results.filter(r => r.type === "chat").map((item, index) => {
                const chat = item as any
                const isSelected = selectedIndex === results.indexOf(item)
                return (
                  <CommandItem
                    key={`chat-${item.id}`}
                    value={chat.title ?? `chat-${item.id}`}
                    onSelect={() => onSelectItem(item)}
                    className={`flex items-center justify-between p-3 ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 mr-3 flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {chat.title ?? "Nouveau chat"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {chat.author || 'Vous'}
                            </span>
                          </div>
                          {chat.updatedAt && (
                            <span className="text-xs text-muted-foreground">
                              • {formatRelativeTime(new Date(chat.updatedAt).getTime())}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {!!results.filter(r => r.type === "document").length && (
            <CommandGroup heading={`📄 Documents (${results.filter(r => r.type === "document").length})`}>
              {results.filter(r => r.type === "document").map((item, index) => {
                const doc = item as any
                const isSelected = selectedIndex === results.indexOf(item)
                return (
                  <CommandItem
                    key={`doc-${doc.id}`}
                    value={doc.name ?? `doc-${doc.id}`}
                    onSelect={() => onSelectItem(item)}
                    className={`flex items-center justify-between p-3 ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 mr-3 flex-shrink-0">
                        {getResultIcon(item)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {getResultPreview(item)}
                          </span>
                          {doc.uploadedAt && (
                            <span className="text-xs text-muted-foreground">
                              • {formatRelativeTime(new Date(doc.uploadedAt).getTime())}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.mimeType?.includes('pdf') && (
                        <Badge variant="secondary" className="text-xs">PDF</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {query.trim().length > 0 && results.length > 0 && (
            <>
              <CommandSeparator />
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-3 w-3" />
                  <span>
                    {results.length} résultat(s) trouvé(s)
                    {filters.types.length < 2 || filters.dateRange !== 'all' ? ' (filtré)' : ''}
                  </span>
                </div>
                <p className="mt-1 text-[10px]">
                  Utilisez ↑↓ pour naviguer • Entrée pour sélectionner • Échap pour fermer
                </p>
              </div>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
