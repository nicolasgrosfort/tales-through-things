import { useState } from "react";

function App() {
  const apiUrl = `http://${window.location.hostname}:3001`;
  const [question, setQuestion] = useState("");

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
          fetch(`${apiUrl}?question=${encodeURIComponent(question)}`)
            .then((response) => response.json())
            .then((data) => console.log(data));
        }}
      >
        Test API
      </button>
    </>
  );
}

export default App;
