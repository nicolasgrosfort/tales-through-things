import fs from "node:fs";
import path from "node:path";
import os from "os";
import z from "zod";
import { ResponseSchema } from "./schemas";
import { DecisionAnswer } from "./types";

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

export function extractQuestion(raw: string): string | null {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const question = JSON.parse(text)?.question;
    if (typeof question === "string" && question.trim()) return question.trim();
  } catch {
    if (text && !text.startsWith("{")) return text;
  }
  return null;
}
