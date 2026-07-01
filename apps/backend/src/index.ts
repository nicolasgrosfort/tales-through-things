import cors from "cors";
import express from "express";
import OpenAI from "openai";
import { getLocalIp } from "./utils/helpers";

const HERMES_SYSTEM_PROMPT = `Tu est un chien !`;

const app = express();
const port = Number(process.env.PORT) || 3001;

const openai = new OpenAI({
  baseURL: "http://localhost:8642/v1",
  apiKey: "tales-through-things",
});

export async function askHermes(message: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "hermes-agent",
    messages: [
      { role: "system", content: HERMES_SYSTEM_PROMPT },
      { role: "user", content: message },
    ],
  });

  return completion.choices[0].message.content ?? "";
}

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

app.get("/", async (req, res) => {
  const question = req.query.question as string;
  const response = await askHermes(question);
  res.json({ status: "ok", response });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
