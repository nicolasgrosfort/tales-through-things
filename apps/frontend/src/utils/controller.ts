import type {
  Analysis,
  AnalyzeConversationResponse,
  GenerateModelResponse,
  HaikuGenerationResponse,
  ImageGenerationResponse,
  ImagePromptGenerationResponse,
  Progression,
  RemoveBackgroundResponse,
} from "../../../shared/types";
import { API_URL } from "./config";
import { useConversationStore } from "./stores";

export async function handleConversation(userAnswer?: string) {
  const { addConversation, conversation } = useConversationStore.getState();

  if (userAnswer) addConversation({ role: "user", content: userAnswer });

  const res = await fetch(`${API_URL}/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation: conversation }),
  });

  if (!res.ok) {
    throw new Error(`Conversation handling failed (${res.status})`);
  }

  const analysis: Analysis = await res.json();

  return analysis;
}

export async function formulateQuestion(
  conversation: string,
  analysis: Analysis | null,
  progression: Progression,
): Promise<string> {
  const res = await fetch(`${API_URL}/ask-question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation, analysis, progression }),
  });

  if (!res.ok) {
    throw new Error(`Question formulation failed (${res.status})`);
  }

  const data = await res.json();

  return data.question;
}

export async function generateImagePrompt(
  conversation: string,
): Promise<ImagePromptGenerationResponse> {
  const res = await fetch(`${API_URL}/generate-image-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation }),
  });

  if (!res.ok) {
    throw new Error(`Image prompt generation failed (${res.status})`);
  }

  const data = await res.json();
  return data;
}

export async function generateHaiku(
  conversation: string,
): Promise<HaikuGenerationResponse> {
  const res = await fetch(`${API_URL}/generate-haiku`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation }),
  });

  if (!res.ok) {
    throw new Error(`Haiku generation failed (${res.status})`);
  }

  return res.json();
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

export const transcribeAudio = async (audio: Blob): Promise<string> => {
  const form = new FormData();
  form.append("file", audio, "audio.mp4");

  const res = await fetch("http://localhost:8001/transcribe", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Transcription failed (${res.status})`);
  }

  const data = await res.json();
  return data.text;
};
