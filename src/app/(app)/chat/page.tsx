import { Chat } from "@/components/chat";
import { generateId } from "ai";

export default async function Page() {
  return <Chat id={generateId()} initialMessages={[]} />;
}
  export const dynamic = 'force-dynamic'; // ⚠️⚠️⚠️ THIS IS REQUIRED TO ENSURE PAGE IS DYNAMIC, NOT PRE-BUILT
