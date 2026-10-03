import type { TOPICS } from "./config";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type Topic = (typeof TOPICS)[number];

export type EvaluationKey = "overall" | Topic;

// Une question "score" SystemOne par clé, renvoyée à plat (valeur 0-100)
export type Evaluation = Record<EvaluationKey, number>;

export type NextQuestion = {
  done: boolean;
  questionId?: string;
  question?: string;
  slots: Record<string, number>;
};

export type ImageGenerationResponse = {
  success: boolean;
  filename: string;
  image_url: string;
  file_path: string;
  width: number;
  height: number;
  seed: number;
};
