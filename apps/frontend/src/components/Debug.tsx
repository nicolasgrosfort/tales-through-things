import { useState } from "react";
import type { Analysis } from "../../../shared/types";
import {
  analyzeConversation,
  formulateQuestion,
  generateImage,
  generateModel,
  removeBackground,
} from "../utils/controller";
import { useLogStore } from "../utils/stores";
import { Button } from "./Button";
import { Scene } from "./Scene";
import { Textfield } from "./Textfield";

export const Debug = () => {
  const { addLog } = useLogStore();

  const [conversation, setConversation] = useState(
    "LLM: Think of a childhood memory that comes easily to mind. Who was with you?\nUser: My cousin Maxime. We often spent the holidays together.\nLLM: What did he look like back then? Do you remember his hair, his height, or what he wore?\nUser: He had brown hair that was always messy, and he was taller than me. He often wore an old red sweater.\nLLM: Did he always carry an object with him—something that reminds you of him?\nUser: Yes, he had a slightly worn blue backpack. He kept marbles and a flashlight in it.\nLLM: Do you remember how he carried it or what he did with it?\nUser: He wore it over one shoulder and opened it whenever he had a new idea for a game.\nLLM: What was he like?\nUser: He was full of energy and always making jokes. He was constantly coming up with new games.\nLLM: And what were you like around him?\nUser: I was more reserved. I followed him on his adventures, but usually let him make the decisions.\nLLM: What detail comes back to you most clearly when you think of him?\nUser: His big smile, his old red sweater, and his blue backpack full of treasures.",
  );
  const [conversationLoading, setConversationLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [formulateQuestionLoading, setFormulateQuestionLoading] =
    useState(false);

  const [imagePromptLoading, setImagePromptLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState(
    "A playful, one-of-a-kind special edition of a classic handheld Game Boy, presented as a clean catalog object. Give it a bright blue casing with fun, distinctive details while keeping its buttons and screen clearly recognizable. Viewed from a 45-degree elevated angle, with its front, side and top surfaces visible. The entire Game Boy is fully visible, centered with generous margins. Straight-on product documentation, orthographic-looking perspective, sharp focus across the whole object. A single, uniform pastel yellow background, soft diffuse studio lighting and a subtle contact shadow directly beneath it. No extra objects, no patterns, no artistic composition.",
  );
  const [imagePath, setImagePath] = useState("");

  const [bgImageUrl, setBgImageUrl] = useState("");
  const [bgLoading, setBgLoading] = useState(false);
  const [bgResult, setBgResult] = useState("");

  const [modelImageUrl, setModelImageUrl] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelResult, setModelResult] = useState("/models/gameboy.ply");

  const handleFormulateQuestion = async (conversation: string) => {
    setFormulateQuestionLoading(true);
    addLog(`Formulating question from conversation:\n${conversation}`);
    try {
      const question = await formulateQuestion(conversation, analysis);
      addLog(`Formulated question:\n${question}`);
    } catch (e) {
      addLog(`Formulate question error: ${String(e)}`);
    } finally {
      setFormulateQuestionLoading(false);
    }
  };

  const handleAnalyzeConversation = async (conversation: string) => {
    setConversationLoading(true);
    addLog(`Analyzing conversation:\n${conversation}`);
    try {
      const analysis = await analyzeConversation(conversation);
      addLog(`Conversation analysis:\n${JSON.stringify(analysis, null, 2)}`);
      setAnalysis(analysis.analysis);
    } catch (e) {
      addLog(`Conversation analysis error: ${String(e)}`);
    } finally {
      setConversationLoading(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    setImagePromptLoading(true);
    addLog(`Generating image with prompt: "${prompt}"`);
    try {
      const generatedImage = await generateImage(prompt);
      addLog(`Image generated:\n${JSON.stringify(generatedImage, null, 2)}`);
      setImagePath(generatedImage.image_url);
      setBgImageUrl(generatedImage.file_path);
    } catch (e) {
      addLog(`Image generation error: ${String(e)}`);
    } finally {
      setImagePromptLoading(false);
    }
  };

  const handleRemoveBackground = async (url: string) => {
    if (!url.trim()) return;
    setBgLoading(true);
    addLog(`Removing background: ${url}`);
    try {
      const imageWithoutBackground = await removeBackground(url.trim());
      addLog(
        `Background removed:\n${JSON.stringify(imageWithoutBackground, null, 2)}`,
      );
      setBgResult(imageWithoutBackground.image_url);
      setModelImageUrl(imageWithoutBackground.file_path);
    } catch (e) {
      addLog(`Remove background error: ${String(e)}`);
    } finally {
      setBgLoading(false);
    }
  };

  const handleGenerateModel = async (url: string) => {
    if (!url.trim()) return;
    setModelLoading(true);
    addLog(`Generating model from: ${url}`);
    try {
      const generatedModel = await generateModel(url.trim());
      addLog(`Model generated:\n${JSON.stringify(generatedModel, null, 2)}`);
      setModelResult(generatedModel.ply_url);
    } catch (e) {
      addLog(`Generate model error: ${String(e)}`);
    } finally {
      setModelLoading(false);
    }
  };

  return (
    <div className="bg-black p-4">
      <h2 className="text-xl font-bold text-white mb-4">Debug</h2>
      <section className="grid grid-rows-[auto_auto] gap-2">
        <div className="grid grid-cols-[1fr_200px] gap-4 items-center">
          <Textfield
            placeholder="Conversation"
            value={conversation}
            onChange={setConversation}
            onSubmit={handleAnalyzeConversation}
          />
          <Button
            label={
              conversationLoading ? "Analyzing..." : "Analyze Conversation"
            }
            onClick={() => {
              void handleAnalyzeConversation(conversation);
            }}
            disabled={conversationLoading || !conversation.trim()}
          />
        </div>

        {imagePath && (
          <img src={imagePath} width="200" height="200" alt="Generated" />
        )}
      </section>

      <section className="grid grid-rows-[auto_auto] gap-2 mt-4">
        <div className="grid grid-cols-[1fr_200px] gap-4 items-center">
          <Textfield
            placeholder="Conversation"
            value={conversation}
            onChange={setConversation}
            onSubmit={handleFormulateQuestion}
          />
          <Button
            label={
              formulateQuestionLoading ? "Generating..." : "Formulate Question"
            }
            onClick={() => {
              void handleFormulateQuestion(conversation);
            }}
            disabled={formulateQuestionLoading || !conversation.trim()}
          />
        </div>

        {imagePath && (
          <img src={imagePath} width="200" height="200" alt="Generated" />
        )}
      </section>

      <section className="grid grid-rows-[auto_auto] gap-2 mt-4">
        <div className="grid grid-cols-[1fr_200px] gap-4 items-center">
          <Textfield
            placeholder="Image prompt"
            value={imagePrompt}
            onChange={setImagePrompt}
            onSubmit={handleGenerateImage}
          />
          <Button
            label={imagePromptLoading ? "Generating..." : "Generate Image"}
            onClick={() => {
              void handleGenerateImage(imagePrompt);
            }}
            disabled={imagePromptLoading || !imagePrompt.trim()}
          />
        </div>

        {imagePath && (
          <img src={imagePath} width="200" height="200" alt="Generated" />
        )}
      </section>

      <section className="grid gap-2 mt-4">
        <div className="grid grid-cols-[1fr_200px] gap-4 items-center">
          <Textfield
            placeholder="Image URL (remove background)"
            value={bgImageUrl}
            onChange={setBgImageUrl}
            onSubmit={handleRemoveBackground}
          />
          <Button
            label={bgLoading ? "Removing..." : "Remove Background"}
            onClick={() => {
              void handleRemoveBackground(bgImageUrl);
            }}
            disabled={bgLoading || !bgImageUrl.trim()}
          />
        </div>
        {bgResult && (
          <img src={bgResult} width="200" height="200" alt="No background" />
        )}
      </section>

      <section className="grid gap-2 mt-4">
        <div className="grid grid-cols-[1fr_200px] gap-4 items-center">
          <Textfield
            placeholder="Image URL (generate model)"
            value={modelImageUrl}
            onChange={setModelImageUrl}
            onSubmit={handleGenerateModel}
          />
          <Button
            label={modelLoading ? "Generating..." : "Generate Model"}
            onClick={() => {
              void handleGenerateModel(modelImageUrl);
            }}
            disabled={modelLoading || !modelImageUrl.trim()}
          />
        </div>
        <div className="h-200">
          {modelResult && <Scene model={modelResult} pointSize={0.002} />}
        </div>
      </section>
    </div>
  );
};
