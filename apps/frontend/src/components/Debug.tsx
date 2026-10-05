import { useState } from "react";
import type { Analysis, Conversation } from "../../../shared/types";
import {
  analyzeConversation,
  formulateQuestion,
  generateImage,
  generateImagePrompt,
  generateModel,
  removeBackground,
  transcribeAudio,
} from "../utils/controller";
import {
  useConversationStore,
  useLogStore,
  useProgressionStore,
} from "../utils/stores";
import { Button } from "./Button";
import { PushToTalk } from "./PushToTalk";
import { Scene } from "./Scene";
import { Textfield } from "./Textfield";

const getLastAssistantQuestion = (conversation: Conversation[]) => {
  const lastAssistantMessage = [...conversation]
    .reverse()
    .find((msg) => msg.role === "assistant");
  return lastAssistantMessage ? lastAssistantMessage.content : null;
};

export const Debug = () => {
  const log = useLogStore();
  const progression = useProgressionStore();
  const conversationStore = useConversationStore();

  const [userResponse, setUserResponse] = useState("");

  const [conversationLoading, setConversationLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [formulateQuestionLoading, setFormulateQuestionLoading] =
    useState(false);

  const [imagePromptLoading, setImagePromptLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imagePath, setImagePath] = useState("");

  const [bgImageUrl, setBgImageUrl] = useState("");
  const [bgLoading, setBgLoading] = useState(false);
  const [bgResult, setBgResult] = useState("");

  const [modelImageUrl, setModelImageUrl] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelResult, setModelResult] = useState("");

  const [transcribeLoading, setTranscribeLoading] = useState(false);

  const handleTranscribe = async (audio: Blob) => {
    setTranscribeLoading(true);
    log.add(`Transcribing audio...`);
    try {
      const text = await transcribeAudio(audio);
      log.add(`Audio transcribed !`);
      await handleConversation(text);
    } catch (e) {
      log.add(`Transcription error: ${String(e)}`);
    } finally {
      setTranscribeLoading(false);
    }
  };

  const handleFormulateQuestion = async (conversation: string) => {
    setFormulateQuestionLoading(true);
    log.add(`Formulating question...`);
    try {
      const question = await formulateQuestion(conversation, analysis, {
        passed: progression.passed,
        remaining: progression.remaining,
      });
      log.add(`Question formulated !`);
      const nextConversation: Conversation[] = [
        ...conversationStore.conversation,
        {
          role: "assistant",
          content: question,
        },
      ];
      conversationStore.setConversation(nextConversation);
    } catch (e) {
      log.add(`Formulate question error: ${String(e)}`);
    } finally {
      setFormulateQuestionLoading(false);
    }
  };

  const handleAnalyzeConversation = async (conversation: string) => {
    setConversationLoading(true);
    log.add(`Analyzing conversation...`);
    try {
      const analysis = await analyzeConversation(conversation);
      log.add(`Conversation analysed !`);
      setAnalysis(analysis.analysis);
    } catch (e) {
      log.add(`Conversation analysis error: ${String(e)}`);
    } finally {
      setConversationLoading(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    setImagePromptLoading(true);
    log.add(`Generating image...`);
    try {
      const generatedImage = await generateImage(prompt);
      log.add(`Image generated !`);
      setImagePath(generatedImage.image_url);
      setBgImageUrl(generatedImage.file_path);
    } catch (e) {
      log.add(`Image generation error: ${String(e)}`);
    } finally {
      setImagePromptLoading(false);
    }
  };

  const handleRemoveBackground = async (url: string) => {
    if (!url.trim()) return;
    setBgLoading(true);
    log.add(`Removing background: ${url}`);
    try {
      const imageWithoutBackground = await removeBackground(url.trim());
      log.add(
        `Background removed:\n${JSON.stringify(imageWithoutBackground, null, 2)}`,
      );
      setBgResult(imageWithoutBackground.image_url);
      setModelImageUrl(imageWithoutBackground.file_path);
    } catch (e) {
      log.add(`Remove background error: ${String(e)}`);
    } finally {
      setBgLoading(false);
    }
  };

  const handleGenerateModel = async (url: string) => {
    if (!url.trim()) return;
    setModelLoading(true);
    log.add(`Generating model...`);
    try {
      const generatedModel = await generateModel(url.trim());
      log.add(`Model generated !`);
      setModelResult(generatedModel.ply_url);
    } catch (e) {
      log.add(`Generate model error: ${String(e)}`);
    } finally {
      setModelLoading(false);
    }
  };

  const handleGenerateImagePrompt = async () => {
    setImagePromptLoading(true);
    log.add(`Generating image prompt...`);
    try {
      const { prompt } = await generateImagePrompt(
        JSON.stringify(conversationStore.conversation),
      );
      log.add(`Image prompt generated !`);
      setImagePrompt(prompt);
    } catch (e) {
      log.add(`Generate image prompt error: ${String(e)}`);
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
    log.add(
      `Progression updated: ${progression.passed + 1} passed, ${
        progression.remaining - 1
      } remaining`,
    );

    if (progression.passed + 1 >= 5) {
      await handleGenerateImagePrompt();
      await handleGenerateImage(imagePrompt);
      await handleRemoveBackground(bgImageUrl);
      await handleGenerateModel(modelImageUrl);
    }
  };

  return (
    <>
      <PushToTalk
        onSubmit={(audio) => {
          void handleTranscribe(audio);
        }}
      />

      <div className="bg-black p-4 text-white flex flex-col gap-4 h-full overflow-y-auto">
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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Image Generation
            </h3>

            <div className=" h-50 w-50 border border-white">
              {imagePath && (
                <img src={imagePath} width="200" height="200" alt="Generated" />
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Background Removal
            </h3>

            <div className=" h-50 w-50 border border-white">
              {bgResult && (
                <img src={bgResult} width="200" height="200" alt="No image" />
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Model</h3>
            <div className="w-50 h-50 border border-white">
              {modelResult && <Scene model={modelResult} pointSize={0.002} />}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-2">
            Conversation
          </h3>
          <pre className="text-xs">
            {JSON.stringify(conversationStore.conversation, null, 2)}
          </pre>
          <h3 className="text-lg font-semibold text-white mb-2">Analysis</h3>
          <pre className="text-xs">{JSON.stringify(analysis, null, 2)}</pre>

          <h3 className="text-lg font-semibold text-white mb-2">
            Image prompt
          </h3>
          <pre className="text-xs">{JSON.stringify(imagePrompt, null, 2)}</pre>
        </section>
      </div>
    </>
  );
};
