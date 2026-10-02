import { useLogStore } from "../utils/stores";

export const Logs = () => {
  const logs = useLogStore((state) => state.logs);

  return (
    <div className="bg-black text-white w-full p-4 font-mono text-xs">
      {logs.reverse().map((log, i) => (
        <p key={i}>{log}</p>
      ))}
    </div>
  );
};
