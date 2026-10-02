import { create } from "zustand";

type Log = string;

interface LogState {
  logs: Log[];
  addLog: (log: Log) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>()((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
}));
