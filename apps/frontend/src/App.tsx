import { useCallback, useRef, useState } from "react";
import { Debug } from "./components/Debug";
import { Logs } from "./components/Logs";
import { API_URL, RESET_DELAY } from "./utils/config";
import { handleConversation } from "./utils/controller";
import {
  useConversationStore,
  useLogStore,
  useProgressionStore,
} from "./utils/stores";

const INITIAL_QUESTION = "Do you want to generate a memory ?";

function App() {
  const inactivityTimer = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);

  const { addLog } = useLogStore();
  const { conversation, reset: resetConversation } = useConversationStore();
  const {
    passed: progressionPassed,
    remaining: progressionRemaining,
    increase: increaseProgression,
    reset: resetProgression,
  } = useProgressionStore();

  const [userAnswer, setUserAnswer] = useState("");
  const [modelQuestion, setModelQuestion] = useState(() => {
    addLog("Initial question set");
    return INITIAL_QUESTION;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(RESET_DELAY);

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

  const handleImageGeneration = (prompt: string) => {
    setIsLoading(true);
    addLog("Image generation started");

    fetch(`${API_URL}/image?prompt=${encodeURIComponent(prompt)}`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Image generation response from backend:", data);
      })
      .finally(() => {
        setIsLoading(false);
        startInactivityTimer();
        addLog("Image generation completed");
      });
  };

  const handleReset = useCallback(() => {
    addLog("Reset experience");
    resetInactivityTimer();
    resetConversation();
    resetProgression();
    setModelQuestion("");
  }, []);

  const handleMessage = useCallback((message: string) => {
    setIsLoading(true);
    setUserAnswer("");
    addLog(`User: "${message}"`);

    handleConversation(message)
      .then((evaluation) => {
        console.log("Evaluation from backend:", evaluation);
      })
      .catch((e) => addLog(`Error: ${e.message}`))
      .finally(() => {
        setIsLoading(false);
        startInactivityTimer();
      });
  }, []);

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Tales Through Things</h1>
        <input
          type="text"
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="Ask a question"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              handleMessage(userAnswer);
            }
          }}
        />
        <br />
        <br />
        <div className="flex gap-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-30"
            disabled={isLoading || userAnswer.trim() === ""}
            onClick={() => {
              handleMessage(userAnswer);
            }}
          >
            Discussion
          </button>
          <button
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-30"
            disabled={isLoading || userAnswer.trim() === ""}
            onClick={() => {
              handleImageGeneration(userAnswer);
            }}
          >
            Imaging
          </button>
          <button
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-30"
            onClick={() => {
              // handleModelGeneration(...);
            }}
          >
            Modeling
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-30"
            disabled={isLoading}
            onClick={handleReset}
          >
            Reset
          </button>{" "}
        </div>

        <p className="text-md font-mono mt-4 mb-4">
          {isLoading ? "Loading..." : modelQuestion}
        </p>

        <p className="text-sm font-mono">Recording: {isRecording.toString()}</p>
        <p className="text-sm text-gray-500">
          Reset automatique dans {countdown}s
        </p>
      </main>
      <div className="grid grid-cols-[1fr_400px] gap-4 ">
        <Debug />
        <Logs />
      </div>
    </>
  );
}

export default App;
