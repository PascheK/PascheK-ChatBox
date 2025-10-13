"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { login } from "@/actions";
export default function LoginPage() {
  const [state, loginAction] = useActionState(login, undefined);
  const { setUser } = useUser();
  const router = useRouter();
  
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
          <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="votre@email.com" />
              {state?.errors?.email && (
                <p className="text-sm text-red-600 mt-1">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" />
              {state?.errors?.password && (
                <p className="text-sm text-red-600 mt-1">{state.errors.password[0]}</p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Connexion
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push("/signup")}
              >
                Créer un compte
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
