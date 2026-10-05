import { useEffect, useState } from "react";
import { PROGRESSION } from "../../../shared/config";
import { RESET_COUNTDOWN_AFTER, RESET_DELAY } from "../utils/config";
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
  composing: "Writing your haiku...",
  imaginating: "Imagining your memory...",
  masking: "Shaping your memory...",
  generating: "Bringing it to life...",
};

export const Main = () => {
  const status = usePipelineStore((s) => s.status);
  const setStatus = usePipelineStore((s) => s.setStatus);
  const passed = useProgressionStore((s) => s.passed);
  const increaseProgression = useProgressionStore((s) => s.increase);
  const conversation = useConversationStore((s) => s.conversation);
  const modelUrl = useResultStore((s) => s.modelUrl);
  const haiku = useResultStore((s) => s.haiku);

  const isRecording = status === "recording";
  const isBusy = status !== "idle";

  // Reset the experience after a period of inactivity. The timer restarts on
  // every status or conversation change, and never fires mid-pipeline.
  // The countdown only runs while it is the user's turn (or the experience is
  // over), and is displayed to the user.
  // Nothing to reset at the very start of the experience (empty conversation).
  const hasStarted = conversation.length > 0 || !!modelUrl;
  const [remaining, setRemaining] = useState(RESET_DELAY);
  useEffect(() => {
    setRemaining(RESET_DELAY);
    if (status !== "idle" || !hasStarted) return;
    const deadline = Date.now() + RESET_DELAY * 1000;
    const interval = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        resetExperience();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [status, conversation, hasStarted]);

  const lastQuestion = [...conversation]
    .reverse()
    .find((msg) => msg.role === "assistant")?.content;

  const showCountdown =
    hasStarted && !isBusy && remaining <= RESET_DELAY - RESET_COUNTDOWN_AFTER;
  const countdown = showCountdown && (
    <p className="text-xs text-white/40 tabular-nums">
      Resetting in {remaining}s
    </p>
  );

  const isGeneratingModel =
    passed >= PROGRESSION.MAX_TURNS && !modelUrl && isBusy;
  const computedGradient = isRecording ? 100 : 0;
  const computedProgress = (passed / PROGRESSION.MAX_TURNS) * 100;

  return (
    <main>
      <PushToTalk
        disabled={(isBusy && !isRecording) || !!modelUrl}
        onRecordStart={() => setStatus("recording")}
        onRecordEnd={() => {
          increaseProgression();
          setStatus("transcribing");
        }}
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
          pulsing={isGeneratingModel}
          className="aspect-square w-118 max-h-118"
        >
          <div className="size-full p-10 rounded-full overflow-hidden bg-black text-white text-center flex justify-center flex-col h-full gap-4">
            {modelUrl ? (
              <>
                <div className="flex-1 min-h-0">
                  <Scene model={modelUrl} pointSize={0.002} />
                </div>
                {haiku && (
                  <p className="text-sm italic whitespace-pre-line text-white/80">
                    {haiku}
                  </p>
                )}
                {countdown}
              </>
            ) : isBusy ? (
              <p className="text-4xl text-pretty">
                {STATUS_LABELS[status] ?? ""}
              </p>
            ) : (
              <>
                <p className="text-4xl text-pretty">{lastQuestion}</p>
                <p className="text-xl">
                  Hold the button to{" "}
                  <span className="text-blue-500">speak</span>
                </p>
                {countdown}
              </>
            )}
          </div>
        </ProgressRing>
      </Gradient>
    </main>
  );
};
