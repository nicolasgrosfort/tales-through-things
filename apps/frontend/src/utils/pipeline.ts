import { PROGRESSION } from "../../../shared/config";
import type { Conversation } from "../../../shared/types";
import {
  analyzeConversation,
  formulateQuestion,
  generateImage,
  generateHaiku,
  generateImagePrompt,
  generateModel,
  removeBackground,
  transcribeAudio,
} from "./controller";
import {
  useConversationStore,
  useLogStore,
  usePipelineStore,
  useProgressionStore,
  useResultStore,
} from "./stores";

// Incremented on every reset so that an in-flight run can detect it is stale
let runId = 0;

export const resetExperience = () => {
  runId++;
  useLogStore.getState().add("Reset experience");
  useConversationStore.getState().reset();
  useProgressionStore.getState().reset();
  useResultStore.getState().reset();
  usePipelineStore.getState().setStatus("idle");
};

const generateMemory = async (isStale: () => boolean) => {
  const { add } = useLogStore.getState();
  const { setStatus } = usePipelineStore.getState();
  const { setImageUrl, setModelUrl, setHaiku } = useResultStore.getState();

  const conversation = JSON.stringify(
    useConversationStore.getState().conversation,
  );

  // The haiku is a bonus: a failure must not block the model generation
  setStatus("composing");
  add("Writing haiku...");
  try {
    const { haiku } = await generateHaiku(conversation);
    if (isStale()) return;
    setHaiku(haiku);
  } catch (e) {
    add(`Haiku error: ${String(e)}`);
  }

  setStatus("imaginating");
  add("Generating image prompt...");
  const { prompt } = await generateImagePrompt(conversation);
  if (isStale()) return;

  add("Generating image...");
  const image = await generateImage(prompt);
  if (isStale()) return;
  setImageUrl(image.image_url);

  setStatus("masking");
  add("Removing background...");
  const masked = await removeBackground(image.file_path);
  if (isStale()) return;

  setStatus("generating");
  add("Generating model...");
  const model = await generateModel(masked.file_path);
  if (isStale()) return;
  setModelUrl(model.ply_url);
  add("Model generated !");
};

export const runTurn = async (audio: Blob) => {
  const id = runId;
  const isStale = () => id !== runId;

  const { add: log } = useLogStore.getState();
  const { setStatus } = usePipelineStore.getState();
  const conversationStore = useConversationStore.getState();

  try {
    setStatus("transcribing");
    log("Transcribing audio...");
    const text = await transcribeAudio(audio);
    if (isStale()) return;
    conversationStore.addConversation({ role: "user", content: text });

    const conversation = JSON.stringify(
      useConversationStore.getState().conversation,
    );

    setStatus("analyzing");
    log("Analyzing conversation...");
    const { analysis } = await analyzeConversation(conversation);
    if (isStale()) return;
    useResultStore.getState().setAnalysis(analysis);

    // The progression is increased when the user stops speaking (record end)
    const { passed, remaining } = useProgressionStore.getState();

    if (passed >= PROGRESSION.MAX_TURNS) {
      await generateMemory(isStale);
    } else {
      setStatus("formulating");
      log("Formulating question...");
      const question = await formulateQuestion(conversation, analysis, {
        passed,
        remaining,
      });
      if (isStale()) return;
      const reply: Conversation = { role: "assistant", content: question };
      useConversationStore.getState().addConversation(reply);
    }
  } catch (e) {
    log(`Pipeline error: ${String(e)}`);
  } finally {
    if (!isStale()) setStatus("idle");
  }
};
