import { parseAsBoolean, useQueryState } from "nuqs";
import { Debug } from "./components/Debug";
import { Logs } from "./components/Logs";
import { Main } from "./components/Main";

function App() {
  const [debug] = useQueryState("debug", parseAsBoolean.withDefault(true));

  return (
    <>
      {debug ? (
        <div className="h-screen w-screen grid grid-cols-[1fr_400px] gap-1 font-mono ">
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
