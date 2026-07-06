export type GlobalState = {
  status: "idle" | "conversing" | "imaging" | "modeling" | "error";
  username?: string;
  haiku?: string;
  prompt?: string;
  image_url?: string;
  image_path?: string;
  model_url?: string;
  model_path?: string;
};

export type Status =
  | "idle"
  | "conversing"
  | "imaging"
  | "modeling"
  | "error"
  | "done";

export type StateResponse = {
  status: "ok" | "pending" | "error";
  updatedAt: string;
  state: GlobalState;
};
