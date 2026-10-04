import type {
  AnalyzeConversationResponse,
  Evaluation,
  GenerateModelResponse,
  ImageGenerationResponse,
  RemoveBackgroundResponse,
} from "../../../shared/types";
import { API_URL } from "./config";
import { useConversationStore } from "./stores";

export async function handleConversation(userAnswer?: string) {
  const { addMessage, conversation } = useConversationStore.getState();

  if (userAnswer) addMessage({ role: "user", content: userAnswer });

  const res = await fetch(`${API_URL}/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation: conversation }),
  });

  if (!res.ok) {
    throw new Error(`Conversation handling failed (${res.status})`);
  }

  const evaluation: Evaluation = await res.json();

  return evaluation;
}

export async function analyzeConversation(
  conversation: string,
): Promise<AnalyzeConversationResponse> {
  const res = await fetch(`${API_URL}/analyze-conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation }),
  });

  if (!res.ok) {
    throw new Error(`Conversation analysis failed (${res.status})`);
  }

  const analysis = await res.json();

  return analysis;
}

export const generateImage = async (
  prompt: string,
): Promise<ImageGenerationResponse> => {
  const res = await fetch(`${API_URL}/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error(`Image generation failed (${res.status})`);
  }

  return await res.json();
};

export const removeBackground = async (
  imagePath: string,
): Promise<RemoveBackgroundResponse> => {
  const res = await fetch(`${API_URL}/remove-background`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagePath }),
  });

  if (!res.ok) {
    throw new Error(`Background removal failed (${res.status})`);
  }

  return await res.json();
};

export const generateModel = async (
  imagePath: string,
): Promise<GenerateModelResponse> => {
  const res = await fetch(`${API_URL}/generate-model`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagePath }),
  });

  if (!res.ok) {
    throw new Error(`Model generation failed (${res.status})`);
  }

  return await res.json();
};
