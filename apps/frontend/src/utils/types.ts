export type GlobalState = {
  status: "idle" | "conversing" | "imaging" | "modeling" | "error";
  username?: string;
  haiku?: string;
  prompt?: string;
  image_url?: string;
  model_url?: string;
};

export type Status = "idle" | "conversing" | "imaging" | "modeling" | "error";

export type StateResponse = {
  status: "ok" | "pending" | "error";
  updatedAt: string;
  state: GlobalState;
};
