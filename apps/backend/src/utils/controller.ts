import { ImageGenerationResponse } from "../../../shared/types";
import {
  OLLAMA_MODEL,
  OLLAMA_URL,
  SYSTEMONE_MODEL,
  SYSTEMONE_URL,
} from "./config";
import { readPromptFile } from "./helpers";
import {
  ChatMessage,
  Evaluation,
  GenerateModelResponse,
  NextQuestion,
} from "./types";

// export async function sendMessage(
//   input: string,
//   history: ChatMessage[] = [],
//   maxRetries = 2,
// ): Promise<{ result: ResponseType; history: ChatMessage[] }> {
//   const baseMessages: ChatMessage[] = [
//     ...buildSystemMessages(),
//     ...history,
//     { role: "user", content: input },
//   ];

//   let lastRaw = "";
//   let lastError = "";

//   for (let attempt = 0; attempt <= maxRetries; attempt++) {
//     const messages: ChatMessage[] =
//       attempt === 0
//         ? baseMessages
//         : [
//             ...baseMessages,
//             { role: "assistant", content: lastRaw },
//             {
//               role: "user",
//               content: `Ta réponse précédente était invalide (erreur : ${lastError}). Réponds à nouveau uniquement avec un JSON valide respectant le schema.`,
//             },
//           ];

//     // Compression avant l'envoi à Hermes
//     const { messages: compressedMessages } = await compress(messages, {
//       baseUrl: HEADROOM_URL,
//       model: "hermes-agent",
//     });

//     const res = await fetch(HERMES_URL, {
//       method: "POST",
//       headers: {
//         Authorization: HERMES_AUTH,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "hermes-agent",
//         messages: compressedMessages,
//         stream: false,
//         response_format: {
//           type: "json_schema",
//           json_schema: { name: "response", schema: responseJsonSchema },
//         },
//       }),
//     });

//     if (!res.ok) {
//       throw new Error(`Hermes HTTP error ${res.status}: ${await res.text()}`);
//     }

//     const data = await res.json();
//     const content = data.choices?.[0]?.message?.content;

//     if (typeof content !== "string") {
//       lastError = "message.content absent ou non-string";
//       lastRaw = JSON.stringify(data);
//       continue;
//     }

//     lastRaw = content;

//     try {
//       const parsed = ResponseSchema.safeParse(
//         JSON.parse(jsonrepair(extractJson(content))),
//       );

//       if (parsed.success) {
//         const updatedHistory: ChatMessage[] = [
//           ...history,
//           { role: "user", content: input },
//           { role: "assistant", content },
//         ];
//         return { result: parsed.data, history: updatedHistory };
//       }

//       lastError = parsed.error.message;
//     } catch (e) {
//       lastError = e instanceof Error ? e.message : String(e);
//     }

//     console.warn(
//       `Hermes JSON invalide (tentative ${attempt + 1}/${maxRetries + 1}) :`,
//       lastError,
//     );
//   }

//   throw new Error(
//     `Échec de validation JSON après ${maxRetries + 1} tentatives. Dernière erreur : ${lastError}\nDernière réponse brute : ${lastRaw}`,
//   );
// }

export async function evaluate(conversation: string): Promise<Evaluation> {
  const res = await fetch(SYSTEMONE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: SYSTEMONE_MODEL,
      state: conversation,
      questions: {
        place: {
          type: "noul",
          instructions:
            "Does the text describe where the memory takes place (type of place, surroundings)?",
          criteria: {
            true: "Yes, the place is described",
            false: "No, the place is missing or vague",
          },
        },
        object: {
          type: "noul",
          instructions:
            "Does the text describe one central object (shape, color or material)?",
          criteria: {
            true: "Yes, an object is described",
            false: "No, the object is missing or vague",
          },
        },
        people: {
          type: "noul",
          instructions:
            "Does the text describe the people present (appearance or actions)?",
          criteria: {
            true: "Yes, people are described",
            false: "No, people are missing or vague",
          },
        },
        moment: {
          type: "noul",
          instructions:
            "Does the text describe one specific moment: what happened, when, at which season or time of day?",
          criteria: {
            true: "Yes, a specific moment is described",
            false: "No, it stays general",
          },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`SystemOne HTTP error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()).answers;
  const evaluation = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      (value as { confidence?: number }).confidence ?? 0,
    ]),
  ) as Evaluation;

  console.log(data);
  return evaluation;
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
): Promise<{ file_path: string; image_url: string; filename: string }> {
  return fetch("http://localhost:8006/remove-background", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagePath }),
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`Remove background failed (${res.status})`);
    }
    return res.json();
  });
}
