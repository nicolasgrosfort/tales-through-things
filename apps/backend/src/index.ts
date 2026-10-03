import cors from "cors";
import express from "express";
import {
  evaluate,
  generateImage,
  generateModel,
  removeBackground,
} from "./utils/controller";
import { getLocalIp } from "./utils/helpers";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/conversation", async (req, res) => {
  const { conversation } = req.body as {
    conversation: string;
  };

  const evaluation = await evaluate(conversation);
  res.json(evaluation);
});

app.post("/image", async (req, res) => {
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
