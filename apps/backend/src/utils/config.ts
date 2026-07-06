import fs from "node:fs";
import path from "node:path";
import { ChatMessage } from "./types";

export const MAX_TURNS = 10;
export const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content: fs.readFileSync(
    path.join(__dirname, "../prompts/HERMES.md"),
    "utf-8",
  ),
};

export const HERMES_URL = "http://localhost:8642/v1/chat/completions";
export const HERMES_AUTH = "Bearer tales-through-things";
export const HEADROOM_URL = `http://localhost:${process.env.HEADROOM_PORT ?? 8787}`;
