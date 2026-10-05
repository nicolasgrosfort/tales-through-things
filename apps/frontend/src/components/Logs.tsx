import { useLogStore } from "../utils/stores";

export const Logs = () => {
  const logs = useLogStore((state) => state.logs);
  const reverseLogs = [...logs].reverse();

  return (
    <div className="bg-black text-white w-full  font-mono text-xs h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 sticky top-0 bg-black p-4">Logs</h2>
      <div className="p-4 pt-0">
        {reverseLogs.map((log, i) => (
          <p key={i}>{log}</p>
        ))}
      </div>
    </div>
  );
};
