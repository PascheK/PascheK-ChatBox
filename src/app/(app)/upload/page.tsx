"use client";

import { useEffect, useState } from "react";
import { processPdfFile, getMyDocuments, deleteDocument } from "@/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, Trash2, Upload } from "lucide-react";
  export const dynamic = 'force-dynamic'; // ⚠️⚠️⚠️ THIS IS REQUIRED TO ENSURE PAGE IS DYNAMIC, NOT PRE-BUILT

export default function PDFUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  type DocRow = { id: number; name: string | null; uploadedAt: string | null };
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const result = await processPdfFile(formData);
      
      if (result.success) {
        setMessage({ type: "success", text: "PDF traité avec succès." });
        e.target.value = "";
        await loadDocuments();
      } else {
        setMessage({ type: "error", text: result.error || "Erreur lors du traitement du PDF." });
      }
    } catch {
      setMessage({ type: "error", text: "Une erreur inattendue s'est produite." });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const documents = await getMyDocuments();
      if (documents.success) {
        setDocs(
          (documents.data || []).map((doc: any) => ({
            id: doc.id,
            name: doc.name ?? "Sans nom",
            uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : null,
          }))
        );
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date inconnue";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Téléchargement de Documents</h1>
          <p className="text-muted-foreground">
            Téléchargez vos documents PDF pour les utiliser dans vos conversations
          </p>
        </div>

        {/* Formulaire d'upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Nouveau Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pdf-upload">Sélectionner un fichier PDF</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="mt-2"
              />
            </div>
            
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Traitement en cours...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertTitle>
              {message.type === "error" ? "Erreur" : "Succès"}
            </AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Liste des documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mes Documents ({docs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun document téléchargé</p>
                <p className="text-sm">Commencez par télécharger votre premier PDF</p>
              </div>
            ) : (
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-red-500" />
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Téléchargé le {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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