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
