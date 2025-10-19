import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-config";
import { users } from "@/lib/db-schema";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MessageCircle, Upload, Bot, Sparkles, Shield, Zap, FileText, Users } from "lucide-react";

export default async function Home() {
  const isDevMode = process.env.NODE_ENV === 'development';
  const user = await getCurrentUser();

  if (isDevMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-4xl mx-auto">
            {/* Logo/Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                <Bot className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                PascheK ChatBox
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Votre assistant IA personnel intelligent pour des conversations naturelles et productives
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full">
                <Link href="/chat">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Commencer à chatter
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full">
                <Link href="/upload">
                  <Upload className="w-5 h-5 mr-2" />
                  Télécharger des documents
                </Link>
              </Button>
            </div>

            {/* Status Badge */}
            {user ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Connecté en tant que {user.email}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour accéder à toutes les fonctionnalités
              </p>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi choisir PascheK ChatBox ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une expérience de chat IA moderne avec des fonctionnalités avancées
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Conversations Intelligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Dialoguez naturellement avec une IA avancée capable de comprendre le contexte et de fournir des réponses pertinentes.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">Analyse de Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Téléchargez et analysez vos documents PDF pour obtenir des insights et des réponses basées sur leur contenu.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Sécurisé & Privé</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Vos données restent privées et sécurisées. Toutes les conversations sont chiffrées et stockées localement.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl">Réponses Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Obtenez des réponses instantanées grâce à notre infrastructure optimisée et nos modèles IA performants.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-xl">Interface Intuitive</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Une interface utilisateur moderne et intuitive conçue pour une expérience utilisateur optimale.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-xl">IA Avancée</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Alimenté par les derniers modèles d'IA pour des conversations plus naturelles et des réponses précises.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Découvrez la puissance de l'IA conversationnelle avec PascheK ChatBox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/auth/login">
                  Commencer maintenant
                </Link>
              </Button>
              {!user && (
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Link href="/auth">
                    Se connecter
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Récupérer l'état de la base de données
  let dbStatus = 'Non connecté';
  let dbError = null;
  try {
    await db.select().from(users).limit(1);
    dbStatus = 'Connecté';
  } catch (error) {
    dbStatus = 'Erreur';
    dbError = error instanceof Error ? error.message : 'Erreur inconnue';
  }

  // Récupérer les variables d'environnement (en masquant les valeurs sensibles)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '********' : 'Non défini',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '********' : 'Non défini',
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'Non défini',
    MINIO_PORT: process.env.MINIO_PORT || 'Non défini',
    MINIO_USE_SSL: process.env.MINIO_USE_SSL || 'Non défini',
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ? '********' : 'Non défini',
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ? '********' : 'Non défini',
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || 'Non défini',
    MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL || 'Non défini',
    SESSION_SECRET: process.env.SESSION_SECRET ? '********' : 'Non défini',
  };

  // Informations sur le build
  const buildInfo = {
    nextVersion: process.env.NEXT_VERSION || 'Non défini',
    buildId: process.env.BUILD_ID || 'Non défini',
    nodeVersion: process.version,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Alert>
        <AlertTitle>Mode Debug</AlertTitle>
        <AlertDescription>
          Cette page n&apos;est visible qu&apos;en mode développement.
          {user && <p className="mt-2">Connecté en tant que : {user.email}</p>}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* État du système */}
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
            <CardDescription>Informations sur l&apos;état actuel de l&apos;application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Mode :</span>
              <Badge variant={isDevMode ? "default" : "secondary"}>
                {process.env.NODE_ENV}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Base de données :</span>
              <Badge variant={dbStatus === 'Connecté' ? "default" : "destructive"}>
                {dbStatus}
              </Badge>
            </div>
            {dbError && (
              <Alert variant="destructive" className="mt-2">
                <AlertTitle>Erreur de base de données</AlertTitle>
                <AlertDescription className="break-all">{dbError}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between items-center">
              <span>Utilisateur :</span>
              <Badge variant={user ? "default" : "secondary"}>
                {user ? user.email : 'Non connecté'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Variables d'environnement */}
        <Card>
          <CardHeader>
            <CardTitle>Variables d&apos;environnement</CardTitle>
            <CardDescription>Configuration actuelle (valeurs sensibles masquées)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm">{key}</span>
                  <Badge variant={value === 'Non défini' ? "destructive" : "default"}>
                    {value}
                  </Badge>
                </div>
                <Separator className="my-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Informations de build */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de build</CardTitle>
            <CardDescription>Détails techniques de l&apos;application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(buildInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-mono text-sm">{key}</span>
                <Badge>{value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Liens rapides</CardTitle>
            <CardDescription>Accès direct aux fonctionnalités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href="/chat"
              >
                Aller au chat
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href="/upload"
              >
                Gérer les documents
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
