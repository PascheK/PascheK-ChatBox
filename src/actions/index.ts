/**
 * @fileoverview Point d'entrée centralisé pour toutes les Server Actions de l'application
 * @module Actions
 * @version 1.0.0
 */

export const dynamic = 'force-dynamic';
// Export des actions d'authentification
export * from "./auth";

// Export des actions de gestion des fichiers
export * from "./upload";

// Export des actions de gestion des chats
export * from "./chat";

// Export des actions de recherche
export * from "./search";