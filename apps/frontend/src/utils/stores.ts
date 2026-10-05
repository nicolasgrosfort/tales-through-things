import { create } from "zustand";
import { PROGRESSION } from "../../../shared/config";
import type { Conversation } from "../../../shared/types";
import type { Log } from "./types";

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
  conversation: Conversation[];
  setConversation: (conversation: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  reset: () => void;
};

export const useConversationStore = create<ConversationState>()((set) => ({
  conversation: [
    {
      role: "assistant",
      content:
        "Bienvenue ! Peux-tu me raconter un moment dont tu te souviens encore aujourd'hui ?",
    },
  ],
  setConversation: (conversation) => set({ conversation }),
  addConversation: (conversation) =>
    set((state) => ({
      conversation: [...state.conversation, conversation],
    })),
  reset: () => set({ conversation: [] }),
}));

//** PIPELINE **//
type PipelineState = {
  status: "idle" | "flux" | "sam3d" | "birefnet";
  run: () => void;
};

export const usePipelineStore = create<PipelineState>()((set) => ({
  status: "idle",
  run: async () => {
    set({ status: "flux" });
  },
}));

//** PROGRESSION **//
type ProgressionState = {
  passed: number;
  remaining: number;
  increase: () => void;
  reset: () => void;
};

export const useProgressionStore = create<ProgressionState>()((set) => ({
  passed: 0,
  remaining: PROGRESSION.MAX_TURNS,
  increase: () =>
    set({
      passed: useProgressionStore.getState().passed + 1,
      remaining: useProgressionStore.getState().remaining - 1,
    }),
  reset: () => set({ passed: 0, remaining: 0 }),
}));
