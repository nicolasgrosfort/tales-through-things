import { useLogStore } from "../utils/stores";

export const Logs = () => {
  const logs = useLogStore((state) => state.logs);

  const reverseLogs = [...logs].reverse();

  return (
    <div className="bg-black text-white w-full p-4 font-mono text-xs">
      <h2 className="text-xl font-bold mb-4">Logs</h2>
      {reverseLogs.map((log, i) => (
        <p key={i}>{log}</p>
      ))}
    </div>
  );
};
