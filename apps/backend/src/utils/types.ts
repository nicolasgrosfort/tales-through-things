import z from "zod";
import { ResponseSchema } from "./schemas";

export type {
  Message as ChatMessage,
  Evaluation,
  NextQuestion,
  Topic,
} from "../../../shared/types";

export type ResponseType = z.infer<typeof ResponseSchema>;

export type Status =
  | "idle"
  | "conversing"
  | "imaging"
  | "modeling"
  | "error"
  | "done";

export type GlobalState = {
  status: Status;
  username?: string;
  haiku?: string;
  prompt?: string;
  object?: string;
  image_url?: string;
  image_path?: string;
  model_url?: string;
  model_path?: string;
};

export type GenerateModelResponse = {
  success: boolean;
  id: string;
  ply_url: string;
  glb_url: string | null;
  file_path: string;
  completed_stages: string[];
};

export type GlobalEvents =
  | "prompt:ready"
  | "image:done"
  | "image:failed"
  | "model:done"
  | "model:failed"
  | "reset";

export type DecisionQuestion =
  | {
      label: string;
      type: "choice";
      instructions: string;
      criteria: Record<string, string>;
    }
  | {
      label: string;
      type: "noul";
      instructions: string;
      criteria: { true: string; false: string };
    };

export type DecisionAnswer = {
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
  [key: string]: unknown;
};

export type DecisionResponse = { answers: Record<string, DecisionAnswer> };
