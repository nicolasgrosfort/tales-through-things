import { create } from "zustand";
import type { Log, Message } from "./types";

// **** LOGS ****
type LogState = {
  logs: Log[];
  addLog: (log: Log) => void;
  clearLogs: () => void;
};

export const useLogStore = create<LogState>()((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
}));

// **** CONVERSATION ****
type ConversationState = {
  conversation: Message[];
  addMessage: (message: Message) => void;
  resetConversation: () => void;
};

export const useConversationStore = create<ConversationState>()((set) => ({
  conversation: [],
  addMessage: (message) =>
    set((state) => ({
      conversation: [...state.conversation, message],
    })),
  resetConversation: () => set({ conversation: [] }),
}));

//** PIPELINE **//
export const usePipelineStore = create<{
  status: "idle" | "flux" | "sam3d" | "birefnet";
  run: () => void;
}>()((set) => ({
  status: "idle",
  run: async () => {
    set({ status: "flux" });
  },
}));
