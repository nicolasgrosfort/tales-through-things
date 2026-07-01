function App() {
  return (
    <>
      <h1>Tales Through Things</h1>
      <button
        onClick={() => {
          fetch("http://localhost:3001/")
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
