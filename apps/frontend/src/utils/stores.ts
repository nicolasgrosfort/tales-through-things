import { create } from "zustand";
import { PROGRESSION } from "../../../shared/config";
import type { Analysis, Conversation } from "../../../shared/types";
import type { Log } from "./types";

// **** LOGS ****
type LogState = {
  logs: Log[];
  add: (log: Log) => void;
  clear: () => void;
};

export const useLogStore = create<LogState>()((set) => ({
  logs: [],
  add: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clear: () => set({ logs: [] }),
}));

// **** CONVERSATION ****
type ConversationState = {
  conversation: Conversation[];
  setConversation: (conversation: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  reset: () => void;
};

const INITIAL_CONVERSATION: Conversation[] = [
  {
    role: "assistant",
    content: "What memory would you like to record today?",
  },
];

export const useConversationStore = create<ConversationState>()((set) => ({
  conversation: INITIAL_CONVERSATION,
  setConversation: (conversation) => set({ conversation }),
  addConversation: (conversation) =>
    set((state) => ({
      conversation: [...state.conversation, conversation],
    })),
  reset: () => set({ conversation: INITIAL_CONVERSATION }),
}));

//** PIPELINE **//
type PipelineState = {
  status:
    | "idle"
    | "recording"
    | "transcribing"
    | "analyzing"
    | "formulating"
    | "composing"
    | "imaginating"
    | "masking"
    | "generating";
  setStatus: (status: PipelineState["status"]) => void;
};

export const usePipelineStore = create<PipelineState>()((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
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
  reset: () => set({ passed: 0, remaining: PROGRESSION.MAX_TURNS }),
}));

//** RESULT **//
type ResultState = {
  analysis: Analysis | null;
  imageUrl: string;
  modelUrl: string;
  haiku: string;
  setAnalysis: (analysis: Analysis | null) => void;
  setImageUrl: (imageUrl: string) => void;
  setModelUrl: (modelUrl: string) => void;
  setHaiku: (haiku: string) => void;
  reset: () => void;
};

export const useResultStore = create<ResultState>()((set) => ({
  analysis: null,
  imageUrl: "",
  modelUrl: "/models/gameboy.ply",
  haiku: "",
  setAnalysis: (analysis) => set({ analysis }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setModelUrl: (modelUrl) => set({ modelUrl }),
  setHaiku: (haiku) => set({ haiku }),
  reset: () => set({ analysis: null, imageUrl: "", modelUrl: "", haiku: "" }),
}));
