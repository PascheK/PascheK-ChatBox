// src/components/app-breadcrumb.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useChatTitle } from "@/hooks/use-chat-title";
import { EditableChatTitle } from "@/components/editable-chat-title";

// Humanise l’affichage d’un segment d’URL
function toTitle(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

type Props = {
  rootLabel?: string; // ex: "Accueil"
  labelMap?: Record<string, string>; // optionnel: map pour surcharger certains labels (par href ou segment)
};

export default function AppBreadcrumb({ rootLabel = "Home", labelMap = {} }: Props) {
  const pathname = usePathname(); // ex: "/chat/123/messages"
  const segments = pathname.split("/").filter(Boolean); // ["chat","123","messages"]
  const chatTitle = useChatTitle(); // Récupère le titre du chat actuel

  // Extraire l'ID du chat si on est sur une page de chat
  const chatMatch = pathname.match(/^\/chat\/([^/]+)/)
  const chatId = chatMatch ? chatMatch[1] : null

  // Construit les crumbs cumulatifs
  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/"); // "/chat", "/chat/123", ...
    const isLast = i === segments.length - 1;
    
    let label = labelMap[href] ?? labelMap[seg] ?? toTitle(seg);
    
    // Si c'est un chat spécifique et qu'on a un titre, l'utiliser
    if (chatTitle && href.startsWith("/chat/") && segments.length >= 2 && i === 1) {
      label = chatTitle;
    }

    return (
      <Fragment key={href}>
        <BreadcrumbItem>
          {isLast ? (
            // Pour la page d'un chat spécifique, afficher le titre éditable
            chatId && chatTitle && href.startsWith("/chat/") && segments.length >= 2 && i === 1 ? (
              <BreadcrumbPage>
                <EditableChatTitle 
                  chatId={chatId} 
                  title={chatTitle}
                />
              </BreadcrumbPage>
            ) : (
              <BreadcrumbPage>{label}</BreadcrumbPage>
            )
          ) : (
            <BreadcrumbLink asChild aria-current={isLast ? "page" : undefined}>
              <Link href={href}>{label}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator />}
      </Fragment>
    );
  });

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>{rootLabel}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{rootLabel}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {segments.length > 0 && <BreadcrumbSeparator />}
        {crumbs}
      </BreadcrumbList>
    </Breadcrumb>
  );
}