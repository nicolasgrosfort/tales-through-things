import { create } from "zustand";
import { PROGRESSION } from "../../../shared/config";
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
  reset: () => void;
};

export const useConversationStore = create<ConversationState>()((set) => ({
  conversation: [],
  addMessage: (message) =>
    set((state) => ({
      conversation: [...state.conversation, message],
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
  increase: (passed: number, remaining: number) => void;
  reset: () => void;
};

export const useProgressionStore = create<ProgressionState>()((set) => ({
  passed: 0,
  remaining: PROGRESSION.MAX_TURNS,
  increase: (passed, remaining) =>
    set({ passed: passed + 1, remaining: remaining - 1 }),
  reset: () => set({ passed: 0, remaining: 0 }),
}));
