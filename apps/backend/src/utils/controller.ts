import ollama from "ollama";
import * as z from "zod";

const HERMES_SYSTEM_PROMPT = "";

const Response = z.object({
  ready: z.boolean(),
  question: z.string(),
});

export async function sendMessage(input: string, conversationId: string) {
  const response = await ollama.chat({
    model: "gemma4:e4b-mlx",
    messages: [{ role: "user", content: input }],
    format: z.toJSONSchema(Response),
  });

  const parsedResponse = Response.parse(response);
  console.log("Parsed response:", parsedResponse);
  return parsedResponse;
}

// export async function sendMessage(input: string, conversationId: string) {
//   const res = await fetch("http://localhost:8642/v1/responses", {
//     method: "POST",
//     headers: {
//       Authorization: "Bearer tales-through-things",
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "hermes-agent",
//       input,
//       conversation: conversationId,
//       instructions:
//         "Tu es un assistant de validation. Remplis le schéma de réponse demandé.",
//       // Force nativement la structure JSON au niveau de l'API Hermes
//       response_format: {
//         type: "json_object",
//         schema: {
//           type: "object",
//           properties: {
//             ready: { type: "boolean" },
//             question: { type: "string" },
//           },
//           required: ["ready", "question"],
//         },
//       },
//     }),
//   });

//   const sessionId = res.headers.get("x-hermes-session-id");
//   const data = await res.json();

//   // Extraction sécurisée du message de l'agent
//   const message = data.output?.find((o: any) => o.type === "message");
//   const rawText = message?.content?.[0]?.text ?? "{}";

//   // Plus besoin de extractJson complexe si l'API renvoie du JSON pur
//   const parsedMessage = JSON.parse(rawText);

//   return {
//     ready: !!parsedMessage.ready,
//     response: parsedMessage.question ?? "",
//     sessionID: sessionId,
//   };
// }

export const getSession = async (sessionId: string) => {
  const apiUrl = sessionId
    ? `http://localhost:8642/api/sessions/${sessionId}`
    : `http://localhost:8642/api/sessions`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer tales-through-things",
    },
  });

  return await res.json();
};

export async function clearSessions(sessionID?: string) {
  let sessions = [];

  if (sessionID) {
    sessions = [sessionID];
  } else {
    const listRes = await fetch("http://localhost:8642/api/sessions", {
      headers: { Authorization: "Bearer tales-through-things" },
    });

    sessions = await listRes.json();
  }

  for (const session of sessions.data ?? sessions) {
    await fetch(`http://localhost:8642/api/sessions/${session.id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer tales-through-things" },
    });
  }
}
