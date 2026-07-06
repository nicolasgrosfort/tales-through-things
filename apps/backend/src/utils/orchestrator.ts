import { EventEmitter } from "events";
import { DEFAULT_STATE } from "./config";
import { generateImage, generateModel } from "./controller";
import { GlobalState } from "./types";

class Orchestrator extends EventEmitter {
  private states = new Map<string, GlobalState>();

  getState(sessionId: string): GlobalState {
    if (!this.states.has(sessionId)) {
      this.states.set(sessionId, { ...DEFAULT_STATE });
    }
    return this.states.get(sessionId)!;
  }

  private setState(sessionId: string, patch: Partial<GlobalState>) {
    const current = this.getState(sessionId);
    this.states.set(sessionId, { ...current, ...patch });
  }

  resetState(sessionId: string) {
    this.states.set(sessionId, { ...DEFAULT_STATE });
  }

  constructor() {
    super();

    this.on(
      "prompt:ready",
      async ({ sessionId, prompt, haiku, username, object }) => {
        this.setState(sessionId, {
          status: "imaging",
          prompt,
          haiku,
          username,
          object,
        });
        try {
          const data = await generateImage(prompt);
          this.emit("image:done", {
            sessionId,
            image_url: data.image_url,
            file_path: data.file_path,
          });
        } catch (error) {
          this.emit("image:failed", { sessionId, error: error as Error });
        }
      },
    );

    this.on("image:done", async ({ sessionId, image_url, file_path }) => {
      this.setState(sessionId, {
        image_url,
        image_path: file_path,
        status: "modeling",
      });
      try {
        const modelData = await generateModel(file_path);
        this.emit("model:done", {
          sessionId,
          modelUrl: modelData.modelUrl,
          filePath: modelData.filePath,
        });
      } catch (error) {
        this.emit("model:failed", { sessionId, error: error as Error });
      }
    });

    this.on("image:failed", ({ sessionId, error }) => {
      console.error(`[${sessionId}] image generation failed:`, error);
      this.setState(sessionId, { status: "error" });
    });

    this.on("model:done", ({ sessionId, modelUrl, filePath }) => {
      this.setState(sessionId, {
        model_url: modelUrl,
        model_path: filePath,
        status: "done",
      });
    });

    this.on("model:failed", ({ sessionId, error }) => {
      console.error(`[${sessionId}] model generation failed:`, error);
      this.setState(sessionId, { status: "error" });
    });
  }
}

export const orchestrator = new Orchestrator();
