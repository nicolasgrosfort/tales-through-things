import { useState } from "react";

function App() {
  const apiUrl = `http://${window.location.hostname}:3001`;

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleMessage = () => {
    setIsLoading(true);
    setQuestion("");

    fetch(`${apiUrl}/message?question=${encodeURIComponent(question)}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Response from backend:", data);
        setIsReady(data.ready);
        setResponse(data.response);
      })
      .finally(() => setIsLoading(false));
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
          {"Send"}
        </button>
        <p>Ready: {isReady.toString()}</p>
      </div>

      <p>{isLoading ? "Loading..." : response}</p>
    </main>
  );
}

export default App;
