'use server'
const PublicRoute = ["/", "/login", "/signup"];
const protectedRoutes = ["/chat", "/api", "/upload", "/dashboard"];
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decrypt, clearSession } from "./lib/session";

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = PublicRoute.includes(path);
  try {
    const cookie = (await cookies()).get("session")?.value;

  const session = await decrypt(cookie);
  const isExpired = (session?.exp ?? 0) !== 0 && Date.now() / 1000 > (session?.exp ?? 0);
    if (session) {
      if ((isProtectedRoute && !session?.userId) || isExpired) {
        clearSession();
        return NextResponse.redirect(new URL("/login", req.nextUrl));
      }

      if (isPublicRoute && session?.userId) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
      }
    }
  } catch {
    if (isProtectedRoute) {
      clearSession();
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
