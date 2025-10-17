import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-config";
import { users } from "@/lib/db-schema";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
export default async function Home() {
  const isDevMode = process.env.NODE_ENV === 'development';
  const user = await getCurrentUser();

  if (isDevMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Bienvenue sur PascheK ChatBox</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Votre assistant IA personnel pour tous vos besoins de conversation
            </p>
          </div>

          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
              href="/chat"
            >
              Commencer à chatter
            </Link>
            <Link
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
              href="/upload"
            >
              Télécharger des documents
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Connectez-vous pour accéder à toutes les fonctionnalités</p>
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