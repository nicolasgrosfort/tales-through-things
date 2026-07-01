import cors from "cors";
import express from "express";
import OpenAI from "openai";
import os from "os";

const HERMES_SYSTEM_PROMPT = `Tu est un chien !`;

const app = express();
const port = Number(process.env.PORT) || 3001;

const openai = new OpenAI({
  baseURL: "http://localhost:8642/v1",
  apiKey: "tales-through-things",
});

const getLocalIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface || []) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "localhost";
};

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
  const response = await askHermes("Hello, how are you?");
  res.json({ status: "ok", response });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
