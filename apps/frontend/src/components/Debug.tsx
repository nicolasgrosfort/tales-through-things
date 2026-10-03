import { useState } from "react";
import {
  generateImage,
  generateModel,
  removeBackground,
} from "../utils/controller";
import { useLogStore } from "../utils/stores";
import { Button } from "./Button";
import { Textfield } from "./Textfield";

export const Debug = () => {
  const { addLog } = useLogStore();
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
  const [modelResult, setModelResult] = useState("");

  const handleGenerateImage = async (prompt: string) => {
    setImagePromptLoading(true);
    addLog(`Generating image with prompt: "${prompt}"`);
    try {
      const image = await generateImage(prompt);
      addLog(`Image generated:\n${JSON.stringify(image, null, 2)}`);
      setImagePath(image.file_path);
      setBgImageUrl(image.file_path);
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
      const { outputPath } = await removeBackground(url.trim());
      addLog(`Background removed: ${outputPath}`);
      setBgResult(outputPath);
      setModelImageUrl(outputPath);
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
      const { outputPath } = await generateModel(url.trim());
      addLog(`Model generated: ${outputPath}`);
      setModelResult(outputPath);
    } catch (e) {
      addLog(`Generate model error: ${String(e)}`);
    } finally {
      setModelLoading(false);
    }
  };

  return (
    <div className="bg-gray-200 p-4">
      <h2 className="text-xl font-bold mb-4">Debug</h2>
      <section className="grid grid-rows-[auto_auto] gap-2">
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
        {modelResult && <p className="text-sm break-all">{modelResult}</p>}
      </section>
    </div>
  );
};
