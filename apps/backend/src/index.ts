import cors from "cors";
import express from "express";
import { DEFAULT_STATE } from "./utils/config";
import { sendMessage } from "./utils/controller";
import { getLocalIp } from "./utils/helpers";
import { orchestrator } from "./utils/orchestrator";
import { ChatMessage, GlobalState } from "./utils/types";

const app = express();
const port = Number(process.env.PORT) || 3001;

const sessions = new Map<string, ChatMessage[]>();
let state: GlobalState = { ...DEFAULT_STATE };

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/message", async (req, res) => {
  const question = req.query.question as string;
  const sessionId = (req.query.sessionId as string) || "default";
  const history = sessions.get(sessionId) ?? [];

  const { result, history: updatedHistory } = await sendMessage(
    question,
    history,
  );

  sessions.set(sessionId, updatedHistory);

  if (result.prompt && result.haiku && result.username && result.object) {
    orchestrator.emit("prompt:ready", {
      sessionId,
      prompt: result.prompt,
      haiku: result.haiku,
      username: result.username,
      object: result.object,
    });
  }

  res.json({
    status: "ok",
    response: result.question,
    history: updatedHistory,
  });
});

app.get("/state", (req, res) => {
  const sessionId = (req.query.sessionId as string) || "default";
  res.json({ status: "ok", state: orchestrator.getState(sessionId) });
});

app.post("/reset", (req, res) => {
  const sessionId = (req.query.sessionId as string) || "default";
  sessions.delete(sessionId);
  orchestrator.resetState(sessionId);
  res.json({ status: "ok" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
