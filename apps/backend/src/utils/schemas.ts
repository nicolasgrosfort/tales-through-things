import z from "zod";

export const ResponseSchema = z.object({
  ready: z.boolean(),
  question: z.string(),
  username: z.string(),
  haiku: z.string(),
  prompt: z.string(),
  image_url: z.string(),
  object: z.string(),
});
