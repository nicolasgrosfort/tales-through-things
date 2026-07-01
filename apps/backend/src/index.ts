import cors from "cors";
import express from "express";
import OpenAI from "openai";
import { getLocalIp } from "./utils/helpers";

const HERMES_SYSTEM_PROMPT = "";

const app = express();
const port = Number(process.env.PORT) || 3001;

const openai = new OpenAI({
  baseURL: "http://localhost:8642/v1",
  apiKey: "tales-through-things",
});

async function askHermes(input: string, conversationId: string) {
  const res = await fetch("http://localhost:8642/v1/responses", {
    method: "POST",
    headers: {
      Authorization: "Bearer tales-through-things",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hermes-agent",
      input,
      conversation: conversationId, // ex: "user-42" ou l'id de ta session
    }),
  });

  const data = await res.json();
  const message = data.output.find((o: any) => o.type === "message");
  return message?.content?.[0]?.text ?? "";
}

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

app.get("/", async (req, res) => {
  const question = req.query.question as string;
  const conversationId = req.query.conversationId as string;
  const response = await askHermes(question, conversationId);
  res.json({ status: "ok", response });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
