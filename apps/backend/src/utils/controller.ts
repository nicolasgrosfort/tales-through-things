import { compress } from "headroom-ai";
import { jsonrepair } from "jsonrepair";
import { HEADROOM_URL, HERMES_AUTH, HERMES_URL } from "./config";
import {
  buildSystemMessages,
  extractJson,
  responseJsonSchema,
} from "./helpers";
import { ResponseSchema } from "./schemas";
import {
  ChatMessage,
  GenerateImageResponse,
  GenerateModelResponse,
  ResponseType,
} from "./types";

export async function sendMessage(
  input: string,
  history: ChatMessage[] = [],
  maxRetries = 2,
): Promise<{ result: ResponseType; history: ChatMessage[] }> {
  const baseMessages: ChatMessage[] = [
    ...buildSystemMessages(),
    ...history,
    { role: "user", content: input },
  ];

  let lastRaw = "";
  let lastError = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const messages: ChatMessage[] =
      attempt === 0
        ? baseMessages
        : [
            ...baseMessages,
            { role: "assistant", content: lastRaw },
            {
              role: "user",
              content: `Ta réponse précédente était invalide (erreur : ${lastError}). Réponds à nouveau uniquement avec un JSON valide respectant le schema.`,
            },
          ];

    // Compression avant l'envoi à Hermes
    const { messages: compressedMessages } = await compress(messages, {
      baseUrl: HEADROOM_URL,
      model: "hermes-agent",
    });

    console.log(
      `Envoi à Hermes (tentative ${attempt + 1}/${maxRetries + 1}) :`,
      {
        messages: compressedMessages,
      },
    );

    const res = await fetch(HERMES_URL, {
      method: "POST",
      headers: {
        Authorization: HERMES_AUTH,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "hermes-agent",
        messages: compressedMessages,
        stream: false,
        response_format: {
          type: "json_schema",
          json_schema: { name: "response", schema: responseJsonSchema },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Hermes HTTP error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      lastError = "message.content absent ou non-string";
      lastRaw = JSON.stringify(data);
      continue;
    }

    lastRaw = content;

    try {
      const parsed = ResponseSchema.safeParse(
        JSON.parse(jsonrepair(extractJson(content))),
      );

      if (parsed.success) {
        const updatedHistory: ChatMessage[] = [
          ...history,
          { role: "user", content: input },
          { role: "assistant", content },
        ];
        return { result: parsed.data, history: updatedHistory };
      }

      lastError = parsed.error.message;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }

    console.warn(
      `Hermes JSON invalide (tentative ${attempt + 1}/${maxRetries + 1}) :`,
      lastError,
    );
  }

  throw new Error(
    `Échec de validation JSON après ${maxRetries + 1} tentatives. Dernière erreur : ${lastError}\nDernière réponse brute : ${lastRaw}`,
  );
}

export async function generateImage(
  prompt: string,
): Promise<GenerateImageResponse> {
  const res = await fetch("http://localhost:8002/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error(`Generation failed (${res.status})`);
  }

  return await res.json();
}

export async function generateModel(
  imagePath: string,
  options: {
    ratio?: number;
    rx?: number;
    ry?: number;
    rz?: number;
  } = {},
): Promise<GenerateModelResponse> {
  const res = await fetch("http://localhost:8003/process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imagePath,
      ratio: options.ratio ?? 1,
      rx: options.rx ?? 0,
      ry: options.ry ?? 0,
      rz: options.rz ?? 0,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
