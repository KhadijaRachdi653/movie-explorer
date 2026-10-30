import { auth } from "@/lib/auth";
import ChatBot from "./ChatBot";

// Server component: the assistant only appears for logged-in users.
export default async function ChatBotLoader() {
  const session = await auth();
  if (!session?.user) return null;
  return <ChatBot />;
}