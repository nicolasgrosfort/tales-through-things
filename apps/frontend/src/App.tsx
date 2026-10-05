import { Debug } from "./components/Debug";
import { Logs } from "./components/Logs";
import { Main } from "./components/Main";

const DEBUG = true;

function App() {
  return (
    <>
      {DEBUG ? (
        <div className="h-screen w-screen grid grid-cols-[1fr_400px] gap-1 ">
          <Debug />
          <Logs />
        </div>
      ) : (
        <Main />
      )}
    </>
  );
}

export default App;
