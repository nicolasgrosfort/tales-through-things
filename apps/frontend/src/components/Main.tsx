import { useCallback, useRef, useState } from "react";
import { RESET_DELAY } from "../utils/config";
import { useLogStore } from "../utils/stores";

export const Main = () => {
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
      <p className="text-sm font-mono">Recording: {isRecording.toString()}</p>
      <p className="text-sm text-gray-500">
        Reset automatique dans {countdown}s
      </p>
    </main>
  );
};
