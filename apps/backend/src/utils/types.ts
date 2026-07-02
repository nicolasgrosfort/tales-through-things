import z from "zod";
import { ResponseSchema } from "./schemas";

export type ResponseType = z.infer<typeof ResponseSchema>;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
