import { Navigation } from "@/components/navigation";
export const dynamic = "force-dynamic";
export const revalidate = 0;                // empêche l’ISR
export const fetchCache = "force-no-store";
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}