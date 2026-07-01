import { useState } from "react";

function App() {
  const apiUrl = `http://${window.location.hostname}:3001`;
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <h1>Tales Through Things</h1>
      <input
        type="text"
        placeholder="Ask a question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <br />
      <br />
      <button
        onClick={() => {
          setIsLoading(true);
          fetch(`${apiUrl}?question=${encodeURIComponent(question)}`)
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
              setResponse(data.response);
            })
            .finally(() => setIsLoading(false));
        }}
      >
        {isLoading ? "Loading..." : "Send"}
      </button>
      <p>{response}</p>
    </>
  );
}

export default App;
