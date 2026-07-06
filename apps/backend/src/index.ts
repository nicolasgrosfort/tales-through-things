import cors from "cors";
import express from "express";
import { generateImage, sendMessage } from "./utils/controller";
import { getLocalIp } from "./utils/helpers";
import { ChatMessage, GlobalState } from "./utils/types";

const app = express();
const port = Number(process.env.PORT) || 3001;

const sessions = new Map<string, ChatMessage[]>();

const state: GlobalState = {
  status: "idle",
  username: undefined,
  haiku: undefined,
  prompt: undefined,
  image_url: undefined,
  model_url: undefined,
};

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

  res.json({
    status: "ok",
    response: result.question,
    ready: result.ready,
    haiku: result.haiku,
    username: result.username,
    image_url: result.image_url,
    prompt: result.prompt,
    object: result.object,
    history: updatedHistory,
  });
});

app.post("/reset", (req, res) => {
  const sessionId = (req.query.sessionId as string) || "default";
  sessions.delete(sessionId);
  res.json({ status: "ok" });
});

app.post("/image", async (req, res) => {
  const prompt = req.query.prompt as string;
  const data = await generateImage(prompt);
  console.log(data);
  res.json({ status: "ok", ...data });
});

// app.post("/model", async (req, res) => {
//   const image_url = req.query.prompt as string;
//   const data = await generateModel(image_url);
//   console.log(data);
//   res.json({ status: "ok", ...data });
// });

app.get("/state", async (req, res) => {
  res.json({ status: "ok", state });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
