import * as z from "zod";

const Response = z.object({
  ready: z.boolean(),
  question: z.string(),
});

type ResponseType = z.infer<typeof Response>;

export async function sendMessage(input: string): Promise<ResponseType> {
  const res = await fetch("http://localhost:8642/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer tales-through-things",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hermes-agent",
      messages: [
        {
          role: "system",
          content: 'Reponse format : {"ready": boolean, "question": string}.',
        },
        { role: "user", content: input },
      ],
      stream: false,
      format: z.toJSONSchema(Response),
    }),
  });

  const data = await res.json();

  console.log("Raw response data:", data);

  return data;
}
