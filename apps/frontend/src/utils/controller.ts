import type {
  Evaluation,
  ImageGenerationResponse,
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

  //   if (evaluation.question) {
  //     addMessage({ role: "assistant", content: evaluation.question });
  //   }

  //   addLog(`Question [${evaluation.questionId}]: ${evaluation.question}`);
  //   return evaluation;
}

export const generateImage = async (
  prompt: string,
): Promise<ImageGenerationResponse> => {
  const res = await fetch(`${API_URL}/image`, {
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
): Promise<{ outputPath: string }> => {
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
): Promise<{ outputPath: string }> => {
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
