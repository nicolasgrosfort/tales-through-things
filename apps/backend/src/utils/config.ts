import { ChatMessage } from "./controller";

export const MAX_TURNS = 10;
export const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content: "",
};
