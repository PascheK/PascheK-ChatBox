"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { register } from "@/actions";
import { useActionState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";
export const dynamic = 'force-dynamic'; // ⚠️⚠️⚠️ THIS IS REQUIRED TO ENSURE PAGE IS DYNAMIC, NOT PRE-BUILT
export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const [state, registerAction] = useActionState(register, undefined);
  
  useEffect(() => {
    if (state?.success && state?.user) {
      // Mettre à jour le contexte utilisateur
      setUser(state.user);
      // Rediriger vers le chat
      router.push("/chat");
    }
  }, [state, router, setUser]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
          <CardDescription className="text-center">
            Entrez vos informations pour créer votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={registerAction}>
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" name="firstName" type="text" placeholder="Jean" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" name="lastName" type="text" placeholder="Dupont" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" name="email" placeholder="votre@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              Créer mon compte
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push("/login")}
              >
                Se connecter
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
      {state?.errors && (
        <div className="absolute left-10 bottom-10">
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Il y a eu une erreur !</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-disc list-inside text-xs">
                {Object.entries(state.errors).map(([field, messages]) =>
                  Array.isArray(messages)
                    ? messages.map((message, idx) => (
                        <li key={`${field}-error-${idx}`}>{message}</li>
                      ))
                    : null
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
