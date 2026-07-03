import { useCallback, useRef, useState } from "react";
import { Whisper } from "./components/Whisper";
import { RESET_DELAY } from "./utils/config";

function App() {
  const apiUrl = `http://${window.location.hostname}:3001`;

  const inactivityTimer = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [haiku, setHaiku] = useState("");
  const [username, setUsername] = useState("");
  const [object, setObject] = useState("");
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

  const handleMessage = (message: string) => {
    startInactivityTimer();

    setIsLoading(true);
    setQuestion("");

    fetch(`${apiUrl}/message?question=${encodeURIComponent(message)}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Response from backend:", data);
        setIsReady(data.ready);
        setHaiku(data.haiku);
        setObject(data.object);
        setUsername(data.username);
        setResponse(data.response);
      })
      .finally(() => setIsLoading(false));
  };

  const handleReset = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    setCountdown(RESET_DELAY);

    fetch(`${apiUrl}/reset`, { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Reset response from backend:", data);
        setIsReady(false);
        setHaiku("");
        setUsername("");
        setObject("");
        setResponse("");
      });
  };

  const handleRecordStart = useCallback(() => {
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
          if (e.key === "Enter") {
            handleMessage(question);
          }
        }}
      />
      <br />
      <br />
      <div className="flex gap-2">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={isLoading || question.trim() === ""}
          onClick={() => {
            handleMessage(question);
          }}
        >
          {"Send"}
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleReset}
        >
          Reset
        </button>{" "}
      </div>

      <p className="text-md font-mono mt-4 mb-4">
        {isLoading ? "Loading..." : response}
      </p>

      <p className="text-sm font-mono">Haiku: {haiku}</p>
      <p className="text-sm font-mono">Objet: {object}</p>
      <p className="text-sm font-mono">Username: {username}</p>
      <p className="text-sm font-mono">Recording: {isRecording.toString()}</p>
      <p className="text-sm font-mono">Ready: {isReady.toString()}</p>
      <p className="text-sm text-gray-500">
        Reset automatique dans {countdown}s
      </p>
    </main>
  );
}

export default App;
