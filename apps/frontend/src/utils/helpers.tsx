import { API_URL } from "./config";
import type { StateResponse } from "./types";

export async function fetchState(): Promise<StateResponse> {
  const res = await fetch(`${API_URL}/state`);
  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status}`);
  }
  return res.json();
}
