function App() {
  const apiUrl = `http://${window.location.hostname}:3001`;

  return (
    <>
      <h1>Tales Through Things</h1>
      <button
        onClick={() => {
          fetch(apiUrl)
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
