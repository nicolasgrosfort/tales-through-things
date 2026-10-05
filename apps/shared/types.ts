import type { TOPICS } from "./config";

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

export type GenerateModelResponse = {
  success: boolean;
  id: string;
  ply_url: string;
  glb_url: string | null;
  file_path: string;
  completed_stages: string[];
};

export type RemoveBackgroundResponse = {
  success: boolean;
  filename: string;
  image_url: string;
  file_path: string;
  width: number;
  height: number;
};

export type Topic = (typeof TOPICS)[number];
export type AnalysisKey = "overall" | Topic;
export type Analysis = Record<AnalysisKey, number>;
export type AnalyzeConversationResponse = {
  success: boolean;
  analysis: Analysis;
};

export type FormulatedQuestionResponse = {
  success: boolean;
  question: string;
};

export type Progression = {
  passed: number;
  remaining: number;
};

export type Conversation = {
  role: "user" | "assistant";
  content: string;
};
