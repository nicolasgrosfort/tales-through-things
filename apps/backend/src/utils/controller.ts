import { jsonrepair } from "jsonrepair";
import * as z from "zod";
import { SYSTEM_PROMPT } from "./config";
import { ResponseSchema } from "./schemas";
import { ChatMessage, ResponseType } from "./types";

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
  console.log(content);
  const parsed = ResponseSchema.parse(JSON.parse(jsonrepair(content)));

  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: "user", content: input },
    { role: "assistant", content },
  ];

  return { result: parsed, history: updatedHistory };
}

export async function generateImage(prompt: string): Promise<string> {
  const res = await fetch("http://localhost:8002/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  const filename = data.filename;
  return filename;
}

export async function generateModel(
  image: File,
  options: {
    ratio?: number;
    rx?: number;
    ry?: number;
    rz?: number;
  } = {},
): Promise<Blob> {
  const formData = new FormData();

  formData.append("file", image);
  formData.append("ratio", String(options.ratio ?? 1.0));
  formData.append("rx", String(options.rx ?? 0));
  formData.append("ry", String(options.ry ?? 0));
  formData.append("rz", String(options.rz ?? 0));

  const res = await fetch("http://localhost:8003/process", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.blob();
}
