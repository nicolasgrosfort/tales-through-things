import {
  AnalyzeConversationResponse,
  GenerateModelResponse,
  ImageGenerationResponse,
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
import { ChatMessage, Evaluation, NextQuestion } from "./types";

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
  const evaluation = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      (value as { noul?: number }).noul ?? 0,
    ]),
  ) as Evaluation;

  return { success: true, analysis: evaluation };
}

export async function formulateQuestion(
  conversation: string,
  next: NextQuestion,
): Promise<string | undefined> {
  const template = next.question;
  if (!template) return undefined;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `
        ${readPromptFile("INTERVIEWER.md")}
        Tu reçois la conversation en cours et une question-gabarit à poser ensuite.
        Reformule ce gabarit en une seule question, naturelle et ouverte, qui rebondit sur la dernière réponse de la personne.
        Garde l'intention du gabarit, remplace les placeholders entre crochets ([sujet], [l'objet]…) par ce qui a été dit, n'invente aucun détail et ne suggère aucune réponse.
        Réponds uniquement avec la question, sans guillemets ni commentaire.
      `,
    },
    {
      role: "user",
      content: `Conversation :\n${conversation}\n\nGabarit : ${template}`,
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
    if (typeof content === "string" && content.trim()) return content.trim();
  } catch (e) {
    console.warn("Formulation de la question échouée, gabarit utilisé :", e);
  }

  return template;
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
