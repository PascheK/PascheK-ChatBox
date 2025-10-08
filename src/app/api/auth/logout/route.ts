import { clearSession } from "@/lib/session";

export async function POST() {
  await clearSession();
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
    },
  });
}
