import cors from "cors";
import express from "express";
import { generateImage, sendMessage } from "./utils/controller";
import { getLocalIp } from "./utils/helpers";
import { ChatMessage } from "./utils/types";

const app = express();
const port = Number(process.env.PORT) || 3001;

const sessions = new Map<string, ChatMessage[]>();

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
  const prompt =
    (req.query.prompt as string) ||
    "Un chat qui discute avec une intelligence artificielle";
  const filename = await generateImage(prompt);
  res.json({ status: "ok", filename });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
