import { useState } from "react";
import type { Analysis, Conversation } from "../../../shared/types";
import {
  analyzeConversation,
  formulateQuestion,
  generateImage,
  generateImagePrompt,
  generateModel,
  removeBackground,
} from "../utils/controller";
import {
  useConversationStore,
  useLogStore,
  useProgressionStore,
} from "../utils/stores";
import { Button } from "./Button";
import { Scene } from "./Scene";
import { Textarea } from "./Textarea";
import { Textfield } from "./Textfield";
import { Whisper } from "./Whisper";

const getLastAssistantQuestion = (conversation: Conversation[]) => {
  const lastAssistantMessage = [...conversation]
    .reverse()
    .find((msg) => msg.role === "assistant");
  return lastAssistantMessage ? lastAssistantMessage.content : null;
};

export const Debug = () => {
  const { addLog } = useLogStore();
  const progression = useProgressionStore();
  const conversationStore = useConversationStore();

  const [userResponse, setUserResponse] = useState("");

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
      const question = await formulateQuestion(conversation, analysis, {
        passed: progression.passed,
        remaining: progression.remaining,
      });
      addLog(`Formulated question:\n${question}`);
      const nextConversation: Conversation[] = [
        ...conversationStore.conversation,
        {
          role: "assistant",
          content: question,
        },
      ];
      conversationStore.setConversation(nextConversation);
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

  const handleGenerateImagePrompt = async () => {
    setImagePromptLoading(true);
    addLog(
      `Generating image prompt from conversation:\n${JSON.stringify(conversationStore.conversation)}`,
    );
    try {
      const { prompt } = await generateImagePrompt(
        JSON.stringify(conversationStore.conversation),
      );
      addLog(`Image prompt generated:\n${JSON.stringify(prompt, null, 2)}`);
      setImagePrompt(prompt);
    } catch (e) {
      addLog(`Generate image prompt error: ${String(e)}`);
    } finally {
      setImagePromptLoading(false);
    }
  };

  const handleConversation = async (conversation: string) => {
    const nextConversation: Conversation[] = [
      ...conversationStore.conversation,
      {
        role: "user",
        content: conversation,
      },
    ];
    conversationStore.setConversation(nextConversation);
    setUserResponse("");

    await handleAnalyzeConversation(JSON.stringify(nextConversation));
    await handleFormulateQuestion(JSON.stringify(nextConversation));

    progression.increase();
  };

  return (
    <>
      <Whisper
        onTranscribeEnd={(transcription) => {
          handleConversation(transcription);
        }}
      />

      <div className="bg-black p-4 text-white flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white">Debug</h2>
        <p>{getLastAssistantQuestion(conversationStore.conversation)}</p>
        <section className="grid grid-cols-[1fr_auto] gap-2">
          <Textfield
            value={userResponse}
            onChange={setUserResponse}
            className="text-black"
            onSubmit={(value) => {
              handleConversation(value);
            }}
          />
          <Button
            label="Add user response"
            onClick={() => {
              handleConversation(userResponse);
            }}
          />
        </section>
        <section>
          <h3 className="text-lg font-semibold text-white mb-2">Actions</h3>
          <div className="flex gap-2 mb-4">
            <Button
              label={
                formulateQuestionLoading
                  ? "Generating..."
                  : "Formulate Question"
              }
              onClick={() => {
                void handleFormulateQuestion(
                  JSON.stringify(conversationStore.conversation),
                );
              }}
              disabled={
                formulateQuestionLoading ||
                !JSON.stringify(conversationStore.conversation).trim()
              }
            />
            <Button
              label={
                conversationLoading ? "Analyzing..." : "Analyze Conversation"
              }
              onClick={() => {
                void handleAnalyzeConversation(
                  JSON.stringify(conversationStore.conversation),
                );
              }}
              disabled={
                conversationLoading ||
                !JSON.stringify(conversationStore.conversation).trim()
              }
            />
            <Button
              label="Generate image prompt"
              onClick={handleGenerateImagePrompt}
            />
            <Button
              label={imagePromptLoading ? "Generating..." : "Generate Image"}
              onClick={() => {
                void handleGenerateImage(imagePrompt);
              }}
              disabled={imagePromptLoading || !imagePrompt.trim()}
            />
            <Button
              label={bgLoading ? "Removing..." : "Remove Background"}
              onClick={() => {
                void handleRemoveBackground(bgImageUrl);
              }}
              disabled={bgLoading || !bgImageUrl.trim()}
            />
            <Button
              label={modelLoading ? "Generating..." : "Generate Model"}
              onClick={() => {
                void handleGenerateModel(modelImageUrl);
              }}
              disabled={modelLoading || !modelImageUrl.trim()}
            />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-2">
            Conversation
          </h3>
          <Textarea
            value={JSON.stringify(conversationStore.conversation, null, 2)}
          />
          <h3 className="text-lg font-semibold text-white mb-2">Analysis</h3>
          <Textarea value={JSON.stringify(analysis)} />

          <h3 className="text-lg font-semibold text-white mb-2">
            Image prompt
          </h3>
          <Textarea value={JSON.stringify(imagePrompt)} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Image Generation
            </h3>
            {imagePath && (
              <img src={imagePath} width="200" height="200" alt="Generated" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Background Removal
            </h3>
            {bgResult && (
              <img
                src={bgResult}
                width="200"
                height="200"
                alt="No background"
              />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Model</h3>
            <div className="w-50">
              {modelResult && <Scene model={modelResult} pointSize={0.002} />}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
