import Image from "next/image";
import Link from "next/link";

export default function Home() {
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
