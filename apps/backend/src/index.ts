import cors from "cors";
import express from "express";
import { DEFAULT_STATE } from "./utils/config";
import { generateImage, generateModel, sendMessage } from "./utils/controller";
import { getLocalIp } from "./utils/helpers";
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

  if (result.prompt) state.prompt = result.prompt;
  if (result.haiku) state.haiku = result.haiku;
  if (result.username) state.username = result.username;

  // Call /image endpoint if ready and prompt is available
  if (result.ready && result.prompt) {
    state.status = "imaging";
    const imageData = generateImage(result.prompt)
      .then((data) => {
        state.image_url = data.image_url;
        state.image_path = data.file_path;

        // Call /model endpoint if image_path is available
        if (state.image_path) {
          state.status = "modeling";
          generateModel(state.image_path)
            .then((modelData) => {
              state.model_url = modelData.modelUrl;
              state.model_path = modelData.filePath;
            })
            .catch((error) => {
              console.error("Error generating model:", error);
            })
            .finally(() => {
              state.status = "done";
            });
        }
      })
      .catch((error) => {
        console.error("Error generating image:", error);
      });
  }

  res.json({
    status: "ok",
    response: result.question,
    ready: result.ready,
    haiku: result.haiku,
    username: result.username,
    prompt: result.prompt,
    object: result.object,
    history: updatedHistory,
  });
});

app.post("/image", async (req, res) => {
  state.status = "imaging";
  const prompt = req.query.prompt as string;
  const data = await generateImage(prompt);
  state.image_url = data.image_url;
  state.image_path = data.file_path;
  console.log(data);
  res.json({ status: "ok", ...data });
});

app.post("/model", async (req, res) => {
  state.status = "modeling";
  const image_path = req.query.image_path as string;
  const data = await generateModel(image_path);
  state.model_url = data.modelUrl;
  state.model_path = data.filePath;
  console.log(data);
  res.json({ status: "ok", ...data });
});

app.get("/state", async (req, res) => {
  res.json({ status: "ok", state });
});

app.post("/reset", (req, res) => {
  const sessionId = (req.query.sessionId as string) || "default";
  sessions.delete(sessionId);
  state = { ...DEFAULT_STATE };
  res.json({ status: "ok" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
