import { apiRequest } from "./api";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

interface ChatResponse {
  reply: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatHistoryItem[],
): Promise<string> {
  const response = (await apiRequest("/api/Chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      history,
    }),
  })) as ChatResponse;

  if (!response || typeof response.reply !== "string" || !response.reply.trim()) {
    throw new Error("The support assistant returned an empty response.");
  }

  return response.reply.trim();
}
