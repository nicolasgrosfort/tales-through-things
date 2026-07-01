import { jsonrepair } from "jsonrepair";
import * as z from "zod";
import { SYSTEM_PROMPT } from "./config";
import { trimHistory } from "./helpers";

const ResponseSchema = z.object({
  ready: z.boolean(),
  question: z.string(),
});

type ResponseType = z.infer<typeof ResponseSchema>;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function sendMessage(
  input: string,
  history: ChatMessage[] = [],
): Promise<{ result: ResponseType; history: ChatMessage[] }> {
  const messages: ChatMessage[] = [
    SYSTEM_PROMPT,
    ...history,
    { role: "user", content: input },
  ];

  const res = await fetch("http://localhost:8642/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer tales-through-things",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hermes-agent",
      messages,
      stream: false,
      response_format: z.toJSONSchema(ResponseSchema),
    }),
  });

  const data = await res.json();
  const content = data.choices[0].message.content;
  const parsed = ResponseSchema.parse(JSON.parse(jsonrepair(content)));

  const updatedHistory: ChatMessage[] = trimHistory([
    ...history,
    { role: "user", content: input },
    { role: "assistant", content },
  ]);

  return { result: parsed, history: updatedHistory };
}
