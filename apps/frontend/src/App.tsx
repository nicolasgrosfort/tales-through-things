import { useCallback, useRef, useState } from "react";
import { Whisper } from "./components/Whisper";
import { usePolling } from "./hooks/usePolling";
import { API_URL, RESET_DELAY } from "./utils/config";
import { fetchState } from "./utils/helpers";
import type { StateResponse } from "./utils/types";

function App() {
  const inactivityTimer = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);

  const data = usePolling<StateResponse>(fetchState, { interval: 5000 });

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("Bonjour :)");
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

  const handleMessage = (message: string) => {
    setIsLoading(true);
    setQuestion("");

    fetch(`${API_URL}/message?question=${encodeURIComponent(message)}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Response from backend:", data);
        setResponse(data.response);
      })
      .finally(() => {
        setIsLoading(false);
        startInactivityTimer();
      });
  };

  const handleImageGeneration = (prompt: string) => {
    setIsLoading(true);

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
      });
  };

  const handleModelGeneration = (image_url: string) => {
    setIsLoading(true);

    fetch(`${API_URL}/model?image_path=${encodeURIComponent(image_url)}`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Model generation response from backend:", data);
      })
      .finally(() => {
        setIsLoading(false);
        startInactivityTimer();
      });
  };

  const handleReset = () => {
    resetInactivityTimer();

    fetch(`${API_URL}/reset`, { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Reset response from backend:", data);
        setResponse("");
      });
  };

  const handleRecordStart = useCallback(() => {
    resetInactivityTimer();
    setIsLoading(true);
    setIsRecording(true);
  }, []);

  const handleTranscribeEnd = useCallback((text: string) => {
    handleMessage(text);
  }, []);

  const handleRecordEnd = useCallback(() => {
    setIsRecording(false);
  }, []);

  return (
    <main className="p-4">
      <Whisper
        onRecordStart={handleRecordStart}
        onTranscribeEnd={handleTranscribeEnd}
        onRecordEnd={handleRecordEnd}
      />
      <h1 className="text-2xl font-bold mb-4">Tales Through Things</h1>
      <input
        type="text"
        className="border border-gray-300 rounded-md p-2 w-full"
        placeholder="Ask a question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            handleMessage(question);
          }
        }}
      />
      <br />
      <br />
      <div className="flex gap-2">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-30"
          disabled={isLoading || question.trim() === ""}
          onClick={() => {
            handleMessage(question);
          }}
        >
          Discussion
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-30"
          disabled={isLoading || question.trim() === ""}
          onClick={() => {
            handleImageGeneration(question);
          }}
        >
          Imaging
        </button>
        <button
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-30"
          disabled={isLoading || !data?.data?.state.image_path}
          onClick={() => {
            handleModelGeneration(data?.data?.state.image_path || "");
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
        {isLoading ? "Loading..." : response}
      </p>

      <p className="text-sm font-mono">Recording: {isRecording.toString()}</p>
      <p className="text-sm text-gray-500">
        Reset automatique dans {countdown}s
      </p>

      <div className="mt-4">
        {data?.data?.state.image_url && (
          <img src={data.data.state.image_url} alt="Generated" />
        )}

        <pre className="text-sm font-mono">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </main>
  );
}

export default App;
