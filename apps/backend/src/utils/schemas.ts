import z from "zod";

export const ResponseSchema = z.object({
  ready: z.boolean(),
  question: z.string(),
  haiku: z.string(),
  object: z.string(),
});
