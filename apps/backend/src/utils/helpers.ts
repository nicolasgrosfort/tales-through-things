import fs from "node:fs";
import path from "node:path";
import os from "os";
import z from "zod";
import { MAX_TURNS } from "./config";
import { ResponseSchema } from "./schemas";
import { ChatMessage, DecisionAnswer } from "./types";

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

export const extractJson = (raw: string): string => {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
};

export const readPromptFile = (filePath: string) => {
  return fs.readFileSync(
    path.join(__dirname, "../skills/" + filePath),
    "utf-8",
  );
};

export const readNoul = (a?: DecisionAnswer): number =>
  (typeof a?.probability === "number" ? a.probability : undefined) ??
  a?.probabilities?.["true"] ??
  0;

export const toTranscript = (history: ChatMessage[]) =>
  history
    .map((m) => `${m.role === "assistant" ? "Q" : "R"} : ${m.content}`)
    .join("\n");
