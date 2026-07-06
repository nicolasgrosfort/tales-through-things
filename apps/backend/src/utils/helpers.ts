import os from "os";
import z from "zod";
import { MAX_TURNS, SYSTEM_PROMPT } from "./config";
import { ResponseSchema } from "./schemas";
import { ChatMessage } from "./types";

export const getLocalIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface || []) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "localhost";
};

export const trimHistory = (history: ChatMessage[]): ChatMessage[] => {
  return history.slice(-MAX_TURNS * 2);
};

export const responseJsonSchema = z.toJSONSchema(ResponseSchema);

export const buildSystemMessages = (): ChatMessage[] => {
  const jsonInstruction: ChatMessage = {
    role: "system",
    content: `
      Tu dois répondre uniquement avec un JSON valide, sans Markdown, sans texte avant ou après, sans bloc \`\`\`json.
      Le JSON doit respecter exactement ce JSON Schema :

      ${JSON.stringify(responseJsonSchema, null, 2)}
      `.trim(),
  };

  return [SYSTEM_PROMPT, jsonInstruction];
};

export const extractJson = (raw: string): string => {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
};
