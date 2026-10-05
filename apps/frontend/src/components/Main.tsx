import { useCallback, useRef, useState } from "react";
import { PROGRESSION } from "../../../shared/config";
import { RESET_DELAY } from "../utils/config";
import { useLogStore, useProgressionStore } from "../utils/stores";
import { Gradient } from "./Gradient";
import { ProgressRing } from "./ProgressRing";
import { PushToTalk } from "./PushToTalk";
import { Scene } from "./Scene";

const model = undefined;

export const Main = () => {
  const log = useLogStore();
  const progression = useProgressionStore();

  const [countdown, setCountdown] = useState(RESET_DELAY);
  const [isRecording, setIsRecording] = useState(false);

  const inactivityTimer = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);

  const startInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    setCountdown(RESET_DELAY);

    countdownInterval.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    inactivityTimer.current = window.setTimeout(() => {
      handleReset();
    }, RESET_DELAY * 1000);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    setCountdown(RESET_DELAY);
  };

  const handleReset = useCallback(() => {
    log.add("Reset experience");
    resetInactivityTimer();
  }, []);

  const computedGradient = isRecording ? 100 : 0;
  const computedProgress = (progression.passed / PROGRESSION.MAX_TURNS) * 100;

  return (
    <main>
      {/* <p className="text-sm font-mono">Recording: {isRecording.toString()}</p>
      <p className="text-sm text-gray-500">
        Reset automatique dans {countdown}s
      </p> */}
      <PushToTalk
        onRecordStart={() => {
          setIsRecording(true);
          progression.increase();
        }}
        onRecordEnd={() => setIsRecording(false)}
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
            <p className="text-4xl text-pretty">
              Do you want to generate a memory ?
            </p>
            <p className="text-xl">
              Hold the button to <span className="text-blue-500">speak</span>
            </p>

            {model && <Scene model="/models/gameboy.ply" pointSize={0.002} />}
          </div>
        </ProgressRing>
      </Gradient>
    </main>
  );
};
