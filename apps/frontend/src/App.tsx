import { useRef, useState } from "react";

function App() {
  const apiUrl = `http://${window.location.hostname}:3001`;

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const conversationID = useRef(`user-${Math.floor(Math.random() * 1000)}`);

  const handleMessage = () => {
    setIsLoading(true);
    setQuestion("");

    fetch(
      `${apiUrl}/message?question=${encodeURIComponent(question)}&conversationId=${conversationID.current}`,
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setResponse(data.response);
      })
      .finally(() => setIsLoading(false));
  };

  const handleSession = (conversationID?: string) => {
    const query = conversationID ? `?conversationId=${conversationID}` : "";
    fetch(`${apiUrl}/session${query}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Session data:", data);
      });
  };

  const handleClearSessions = (conversationID?: string) => {
    const query = conversationID ? `?conversationId=${conversationID}` : "";
    fetch(`${apiUrl}/clear-sessions${query}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Clear sessions response:", data);
      });
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tales Through Things</h1>
      <input
        type="text"
        className="border border-gray-300 rounded-md p-2 w-full"
        placeholder="Ask a question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleMessage();
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
            handleMessage();
          }}
        >
          {isLoading ? "Loading..." : "Send"}
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleSession(conversationID.current)}
        >
          Log Current Session
        </button>
        <button
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleClearSessions(conversationID.current)}
        >
          Clear Current Session
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleSession()}
        >
          Log All Session
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={async () => handleClearSessions()}
        >
          Clear All Sessions
        </button>
      </div>

      <p>{response}</p>
    </main>
  );
}

export default App;
