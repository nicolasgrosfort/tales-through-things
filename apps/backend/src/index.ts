import cors from "cors";
import express from "express";

import { clearSessions, getSession, sendMessage } from "./utils/controller";
import { getLocalIp } from "./utils/helpers";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

app.get("/message", async (req, res) => {
  const question = req.query.question as string;
  const conversationId = req.query.conversationId as string;
  const response = await sendMessage(question, conversationId);
  res.json({ status: "ok", response });
});

app.get("/session", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const sessionData = await getSession(sessionId);
  res.json({ status: "ok", session: sessionData });
});

app.get("/clear-sessions", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  await clearSessions(sessionId);
  res.json({ status: "ok" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
