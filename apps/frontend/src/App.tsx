import { useState } from "react";

function App() {
  const apiUrl = `http://${window.location.hostname}:3001`;

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [haiku, setHaiku] = useState("");
  const [username, setUsername] = useState("");
  const [object, setObject] = useState("");

  const handleMessage = (message: string) => {
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

  // useEffect(() => {
  //   handleReset();
  //   handleMessage(
  //     `Salut, j'ai besoin que tu m'aides à décrire un souvenir qui m'est cher.`,
  //   );
  // }, []);

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
      <p className="text-sm font-mono">Ready: {isReady.toString()}</p>
    </main>
  );
}

export default App;
