import {
  Analysis,
  AnalyzeConversationResponse,
  FormulatedQuestionResponse,
  GenerateModelResponse,
  ImageGenerationResponse,
  Progression,
  RemoveBackgroundResponse,
} from "../../../shared/types";
import {
  OLLAMA_MODEL,
  OLLAMA_URL,
  SYSTEMONE_MODEL,
  SYSTEMONE_QUESTIONS,
  SYSTEMONE_URL,
} from "./config";
import { readPromptFile } from "./helpers";

export async function analyseConversation(
  conversation: string,
): Promise<AnalyzeConversationResponse> {
  const res = await fetch(SYSTEMONE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: SYSTEMONE_MODEL,
      state: conversation,
      questions: SYSTEMONE_QUESTIONS,
    }),
  });

  if (!res.ok) {
    throw new Error(`SystemOne HTTP error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()).answers;
  const analysis = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      (value as { noul?: number }).noul ?? 0,
    ]),
  ) as Analysis;

  return { success: true, analysis };
}

export async function formulateQuestion(
  conversation: string,
  analysis: Analysis,
  progression: Progression,
): Promise<FormulatedQuestionResponse> {
  const messages = [
    {
      role: "system",
      content: `${readPromptFile("INTERVIEWER.md")}`,
    },
    {
      role: "user",
      content: `Conversation :\n${conversation}\n\Analyse : ${analysis}\n\Progression : ${progression}`,
    },
  ];

  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const content = (await res.json()).choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim())
      return { success: true, question: content.trim() };
  } catch (e) {
    console.warn("Formulation de la question échouée, gabarit utilisé :", e);
  }

  return {
    success: false,
    question:
      "Bienvenue ! Peux-tu me raconter un moment dont tu te souviens encore aujourd'hui ?",
  };
}

export async function generateImage(
  prompt: string,
): Promise<ImageGenerationResponse> {
  const res = await fetch("http://localhost:8002/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt,
      width: 512,
      height: 512,
      steps: 2,
    }),
  });

  if (!res.ok) {
    throw new Error(`Generation failed (${res.status})`);
  }

  return await res.json();
}

export async function generateModel(
  imagePath: string,
  options: {
    seed?: number;
    glb?: boolean;
  } = {},
): Promise<GenerateModelResponse> {
  const res = await fetch("http://localhost:8005/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imagePath,
      seed: options.seed ?? 42,
      glb: options.glb ?? false,

      stage1Steps: 4,
      stage2Steps: 4,
      memoryProfile: "balanced",
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function removeBackground(
  imagePath: string,
): Promise<RemoveBackgroundResponse> {
  const res = await fetch("http://localhost:8006/remove-background", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagePath }),
  });

  if (!res.ok) {
    throw new Error(`Remove background failed (${res.status})`);
  }

  return res.json();
}
