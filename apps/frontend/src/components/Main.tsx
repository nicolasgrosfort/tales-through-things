import { useCallback, useRef, useState } from "react";
import { RESET_DELAY } from "../utils/config";
import { useLogStore } from "../utils/stores";
import { Gradient } from "./Gradient";
import { Scene } from "./Scene";

export const Main = ({ gradient = 50 }: { gradient?: number }) => {
  const log = useLogStore();

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

  return (
    <main>
      {/* <p className="text-sm font-mono">Recording: {isRecording.toString()}</p>
      <p className="text-sm text-gray-500">
        Reset automatique dans {countdown}s
      </p> */}
      <Gradient
        percent={gradient}
        className="h-screen w-screen grid place-items-center"
      >
        <div className="aspect-square w-118 max-h-118 p-10 rounded-full overflow-hidden bg-black">
          <Scene model="/models/gameboy.ply" pointSize={0.002} />
        </div>
      </Gradient>
    </main>
  );
};
