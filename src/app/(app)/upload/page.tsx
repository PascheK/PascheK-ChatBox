"use client";

import { useEffect, useState } from "react";
import { processPdfFile, getMyDocuments, deleteDocument, getDocumentUrl, downloadDocument } from "@/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  FileText, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileIcon, 
  HardDrive,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
  export const dynamic = 'force-dynamic'; // ⚠️⚠️⚠️ THIS IS REQUIRED TO ENSURE PAGE IS DYNAMIC, NOT PRE-BUILT

export default function PDFUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [filterBy, setFilterBy] = useState<"all" | "recent" | "large">("all");

  type DocRow = { 
    id: number; 
    name: string | null; 
    uploadedAt: string | null; 
    fileSize?: number;
    mimeType?: string;
  };
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Validation
    if (file.type !== 'application/pdf') {
      setMessage({ type: "error", text: "Seuls les fichiers PDF sont acceptés." });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
      setMessage({ type: "error", text: "Le fichier ne peut pas dépasser 50MB." });
      return;
    }
    
    setIsLoading(true);
    setUploadProgress(0);
    setMessage(null);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append("pdf", file);
      const result = await processPdfFile(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        setMessage({ type: "success", text: `PDF "${file.name}" traité avec succès et indexé dans la base de connaissances.` });
        await loadDocuments();
      } else {
        setMessage({ type: "error", text: result.error || "Erreur lors du traitement du PDF." });
      }
    } catch {
      setMessage({ type: "error", text: "Une erreur inattendue s'est produite." });
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
      e.target.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      await handleFileUpload(pdfFile);
    } else {
      setMessage({ type: "error", text: "Veuillez déposer un fichier PDF." });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const loadDocuments = async () => {
    try {
      const documents = await getMyDocuments();
      if (documents.success) {
        console.log("Fetched documents:", documents.data);
        const mappedDocs = (documents.data || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name ?? "Sans nom",
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : null,
          fileSize: doc.fileSize || 0,
          mimeType: doc.mimeType || 'application/pdf',
        }));
        
        setDocs(mappedDocs);
        
        // Calculer la taille totale
        const total = mappedDocs.reduce((sum: number, doc: any) => sum + (doc.fileSize || 0), 0);
        setTotalSize(total);
      }
    } catch {
      // Error handled silently
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const result = await deleteDocument(id);
      if (result?.success) {
        setDocs(prev => prev.filter(doc => doc.id !== id));
        setMessage({ type: "success", text: "Document supprimé avec succès." });
      } else {
        setMessage({ type: "error", text: result?.error || "Erreur lors de la suppression." });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la suppression du document." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      setMessage({ type: "info", text: "Téléchargement en cours..." });
      
      const result = await downloadDocument(id);
      if (result?.success && result.data) {
        // Créer un blob et télécharger le fichier
        const uint8Array = new Uint8Array(result.data.buffer);
        const blob = new Blob([uint8Array], { 
          type: result.data.mimeType || 'application/pdf' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.data.name || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: "success", text: "Document téléchargé avec succès." });
      } else {
        setMessage({ type: "error", text: result?.error || "Erreur lors du téléchargement." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors du téléchargement du document." });
    }
  };

  const handlePreview = async (id: number) => {
    try {
      const result = await getDocumentUrl(id);
      if (result?.success && result.url) {
        // Ouvrir le document dans un nouvel onglet pour prévisualisation
        window.open(result.url, '_blank');
        setMessage({ type: "success", text: "Document ouvert pour prévisualisation." });
      } else {
        setMessage({ type: "error", text: result?.error || "Erreur lors de l'ouverture du document." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de l'ouverture du document." });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Aujourd'hui";
    if (diffDays === 2) return "Hier";
    if (diffDays <= 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtrage et tri des documents
  const filteredAndSortedDocs = docs
    .filter(doc => {
      const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      switch (filterBy) {
        case "recent":
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 7);
          return matchesSearch && doc.uploadedAt && new Date(doc.uploadedAt) > dayAgo;
        case "large":
          return matchesSearch && (doc.fileSize || 0) > 1024 * 1024; // > 1MB
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "size":
          return (b.fileSize || 0) - (a.fileSize || 0);
        case "date":
        default:
          return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      }
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header avec statistiques */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion des Documents</h1>
            <p className="text-muted-foreground">
              Téléchargez et gérez vos documents PDF pour enrichir votre base de connaissances
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Card className="p-4 min-w-[160px]">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{docs.length}</p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 min-w-[160px]">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                  <p className="text-sm text-muted-foreground">Espace utilisé</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Zone d'upload améliorée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Nouveau Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone de drop */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${dragOver ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Upload className={`h-8 w-8 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-lg font-medium mb-1">
                    {dragOver ? 'Relâchez pour télécharger' : 'Glissez-déposez votre PDF ici'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou cliquez pour sélectionner un fichier
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>• Format PDF uniquement</span>
                  <span>• Taille max: 50MB</span>
                  <span>• Indexation automatique</span>
                </div>
              </div>
              
              <Input
                type="file"
                accept=".pdf"
                onChange={handleInputChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            
            {/* Progress bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Traitement en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyse du contenu et génération des embeddings</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : message.type === "info" ? "default" : "default"}>
            <div className="flex items-center gap-2">
              {message.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {message.type === "error" && <AlertCircle className="h-4 w-4" />}
              {message.type === "info" && <FileIcon className="h-4 w-4" />}
              <AlertTitle>
                {message.type === "error" ? "Erreur" : message.type === "success" ? "Succès" : "Information"}
              </AlertTitle>
            </div>
            <AlertDescription className="mt-2">{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Contrôles de recherche et filtrage */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans vos documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: "name" | "date" | "size") => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Par date</SelectItem>
                <SelectItem value="name">Par nom</SelectItem>
                <SelectItem value="size">Par taille</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterBy} onValueChange={(value: "all" | "recent" | "large") => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="recent">Récents</SelectItem>
                <SelectItem value="large">Volumineux</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des documents améliorée */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mes Documents ({filteredAndSortedDocs.length})
                {searchQuery && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredAndSortedDocs.length} résultat(s)
                  </Badge>
                )}
              </CardTitle>
              {docs.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Total: {formatFileSize(totalSize)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredAndSortedDocs.length === 0 ? (
              <div className="text-center py-12">
                {searchQuery ? (
                  <div className="space-y-4">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <div>
                      <p className="font-medium">Aucun résultat trouvé</p>
                      <p className="text-sm text-muted-foreground">
                        Essayez de modifier votre recherche ou vos filtres
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterBy("all");
                      }}
                    >
                      Effacer les filtres
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <div>
                      <p className="font-medium">Aucun document téléchargé</p>
                      <p className="text-sm text-muted-foreground">
                        Commencez par télécharger votre premier PDF
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {doc.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(doc.uploadedAt)}</span>
                          </div>
                          {doc.fileSize && (
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              <span>{formatFileSize(doc.fileSize)}</span>
                            </div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            PDF
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreview(doc.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </DropdownMenuItem>
                          <Separator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(doc.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}