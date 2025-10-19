const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth"];
const protectedRoutes = ["/chat", "/api", "/upload", "/dashboard", "/devnotes"];
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decrypt, clearSession } from "./lib/session";

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Vérifier si c'est une route protégée (exact match ou commence par)
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(route + "/")
  );
  
  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(route + "/")
  );
  try {
    const cookie = (await cookies()).get("session")?.value;
    const session = await decrypt(cookie);
    
    // Vérifier si la session est expirée
    const isExpired = session?.exp && Date.now() / 1000 > (session.exp as number);
    
    // Si pas de session ou session expirée et route protégée
    if (isProtectedRoute && (!session?.userId || isExpired)) {
      if (isExpired) {
        await clearSession();
      }
      return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
    }
    
    // Si utilisateur connecté essaie d'accéder aux pages d'auth
    if (session?.userId && (path === "/auth/login" || path === "/auth/signup")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    
  } catch (error) {
    console.error("Middleware error:", error);
    
    // En cas d'erreur sur une route protégée, rediriger vers login
    if (isProtectedRoute) {
      await clearSession();
      return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
