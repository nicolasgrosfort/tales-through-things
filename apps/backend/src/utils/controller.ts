import * as z from "zod";

const ResponseSchema = z.object({
  ready: z.boolean(),
  question: z.string(),
});

type ResponseType = z.infer<typeof ResponseSchema>;

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
          content:
            'Reponse toujours dans ce format : {"ready": boolean, "question": string}.',
        },
        { role: "user", content: input },
      ],
      stream: false,
      format: z.toJSONSchema(ResponseSchema),
    }),
  });

  const data = await res.json();
  console.log("Raw response from HERMES API:", data);
  //   const content = data.response.choices[0].message.content;
  //   const parsed = ResponseSchema.parse(JSON.parse(content));

  return data;
}
