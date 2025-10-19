"use client";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Navigation() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/auth/login");
      router.refresh();
    } catch {
      // Error handled silently
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActivePage = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const getUserInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return user?.email[0].toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user?.email || "Utilisateur";
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-background border-b border-border shadow-sm relative z-50">
      <div className="flex items-center gap-8">
        <Link 
          href={user ? "/dashboard" : "/"} 
          className="text-xl font-bold text-foreground hover:text-primary transition-colors"
        >
          PascheK ChatBox
        </Link>
        
        {user && (
          <div className="hidden md:flex gap-6">
            <Link
              href="/chat"
              aria-current={isActivePage('/chat') ? 'page' : undefined}
              className={`hover:text-primary transition-colors ${
                isActivePage('/chat') ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              Chat
            </Link>
            <Link
              href="/upload"
              aria-current={isActivePage('/upload') ? 'page' : undefined}
              className={`hover:text-primary transition-colors ${
                isActivePage('/upload') ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              Upload
            </Link>
          </div>
        )}
      </div>

      <div className="flex gap-4 items-center">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm">
                  {getUserDisplayName()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/chat">Chat</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="md:hidden">
                <Link href="/upload">Upload</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive"
              >
                {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">S'inscrire</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
