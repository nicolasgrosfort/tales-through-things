import { readPromptFile } from "./helpers";
import { ChatMessage, GlobalState } from "./types";

export const MAX_TURNS = 10;
export const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content: `
    ${readPromptFile("INTERVIEWER.md")}
    ${readPromptFile("HAIKU.md")}
  `,
};

export const HERMES_URL = "http://localhost:8642/v1/chat/completions";
export const HERMES_AUTH = "Bearer tales-through-things";
export const HEADROOM_URL = `http://localhost:${process.env.HEADROOM_PORT ?? 8787}`;

export const DEFAULT_STATE: GlobalState = {
  status: "idle",
};
