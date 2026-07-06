import z from "zod";
import { ResponseSchema } from "./schemas";

export type ResponseType = z.infer<typeof ResponseSchema>;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateImageResponse = {
  success: boolean;
  filename: string;
  image_url: string;
  file_path: string;
  width: number;
  height: number;
};

export type Status = "idle" | "conversing" | "imaging" | "modeling" | "error";

export type GlobalState = {
  status: Status;
  username?: string;
  haiku?: string;
  prompt?: string;
  image_url?: string;
  model_url?: string;
};
