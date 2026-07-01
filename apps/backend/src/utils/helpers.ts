import os from "os";
import { MAX_TURNS } from "./config";
import { ChatMessage } from "./controller";

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

export const extractJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response: " + text);
  return JSON.parse(match[0]);
};

export const trimHistory = (history: ChatMessage[]): ChatMessage[] => {
  return history.slice(-MAX_TURNS * 2);
};
