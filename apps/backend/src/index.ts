import cors from "cors";
import express from "express";
import { Analysis, Progression } from "../../shared/types";
import {
  analyseConversation,
  formulateQuestion,
  generateImage,
  generateHaiku,
  generateImagePrompt,
  generateModel,
  removeBackground,
} from "./utils/controller";
import { getLocalIp } from "./utils/helpers";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/ask-question", async (req, res) => {
  const { conversation, analysis, progression } = req.body as {
    conversation: string;
    analysis: Analysis;
    progression: Progression;
  };

  const question = await formulateQuestion(conversation, analysis, progression);
  res.json(question);
});

app.post("/analyze-conversation", async (req, res) => {
  const { conversation } = req.body as {
    conversation: string;
  };

  const evaluation = await analyseConversation(conversation);
  res.json(evaluation);
});

app.post("/generate-image-prompt", async (req, res) => {
  const { conversation } = req.body as { conversation: string };

  const imagePrompt = await generateImagePrompt(conversation);
  res.json(imagePrompt);
});

app.post("/generate-haiku", async (req, res) => {
  const { conversation } = req.body as { conversation: string };

  try {
    res.json(await generateHaiku(conversation));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body as { prompt: string };

  const image = await generateImage(prompt);
  res.json(image);
});

app.post("/remove-background", async (req, res) => {
  const { imagePath } = req.body as { imagePath: string };

  try {
    const result = await removeBackground(imagePath);
    res.json({ ...result, outputPath: result.file_path });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/generate-model", async (req, res) => {
  const { imagePath } = req.body as { imagePath: string };

  try {
    const result = await generateModel(imagePath);
    res.json({ ...result, outputPath: result.file_path });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
