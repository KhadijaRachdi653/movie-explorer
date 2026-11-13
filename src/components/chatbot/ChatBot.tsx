import { auth } from "@/lib/auth";
import ChatBotClient from "./ChatBotClient";

// Le compte connecté est lu côté serveur et sert de clé : à la déconnexion ou au changement de compte,
// React recrée CineBot et la conversation repart de zéro
export default async function ChatBot() {
  const session = await auth();
  const owner = session?.user?.email ?? "";
  return <ChatBotClient key={owner} owner={owner} />;
}
