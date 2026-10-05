import { useEffect } from "react";
import { PROGRESSION } from "../../../shared/config";
import { RESET_DELAY } from "../utils/config";
import { resetExperience, runTurn } from "../utils/pipeline";
import {
  useConversationStore,
  usePipelineStore,
  useProgressionStore,
  useResultStore,
} from "../utils/stores";
import { Gradient } from "./Gradient";
import { ProgressRing } from "./ProgressRing";
import { PushToTalk } from "./PushToTalk";
import { Scene } from "./Scene";

const STATUS_LABELS: Partial<
  Record<ReturnType<typeof usePipelineStore.getState>["status"], string>
> = {
  recording: "Listening...",
  transcribing: "Thinking...",
  analyzing: "Thinking...",
  formulating: "Thinking...",
  imaginating: "Imagining your memory...",
  masking: "Shaping your memory...",
  generating: "Bringing it to life...",
};

export const Main = () => {
  const status = usePipelineStore((s) => s.status);
  const setStatus = usePipelineStore((s) => s.setStatus);
  const passed = useProgressionStore((s) => s.passed);
  const conversation = useConversationStore((s) => s.conversation);
  const modelUrl = useResultStore((s) => s.modelUrl);

  const isRecording = status === "recording";
  const isBusy = status !== "idle";

  // Reset the experience after a period of inactivity. The timer restarts on
  // every status or conversation change, and never fires mid-pipeline.
  useEffect(() => {
    if (status !== "idle") return;
    const timer = window.setTimeout(resetExperience, RESET_DELAY * 1000);
    return () => clearTimeout(timer);
  }, [status, conversation]);

  const lastQuestion = [...conversation]
    .reverse()
    .find((msg) => msg.role === "assistant")?.content;

  const computedGradient = isRecording ? 100 : 0;
  const computedProgress = (passed / PROGRESSION.MAX_TURNS) * 100;

  return (
    <main>
      <PushToTalk
        disabled={(isBusy && !isRecording) || !!modelUrl}
        onRecordStart={() => setStatus("recording")}
        onRecordEnd={() => setStatus("transcribing")}
        onSubmit={(audio) => {
          void runTurn(audio);
        }}
      />
      <Gradient
        percent={computedGradient}
        className="h-screen w-screen grid place-items-center"
      >
        <ProgressRing
          percent={computedProgress}
          className="aspect-square w-118 max-h-118"
        >
          <div className="size-full p-10 rounded-full overflow-hidden bg-black text-white text-center flex justify-center flex-col h-full gap-4">
            {modelUrl ? (
              <Scene model={modelUrl} pointSize={0.002} />
            ) : isBusy ? (
              <p className="text-4xl text-pretty">{STATUS_LABELS[status]}</p>
            ) : (
              <>
                <p className="text-4xl text-pretty">{lastQuestion}</p>
                <p className="text-xl">
                  Hold the button to{" "}
                  <span className="text-blue-500">speak</span>
                </p>
              </>
            )}
          </div>
        </ProgressRing>
      </Gradient>
    </main>
  );
};
