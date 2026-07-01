import cors from "cors";
import express from "express";
import os from "os";

const app = express();
const port = Number(process.env.PORT) || 3001;

const getLocalIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface || []) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "localhost";
};

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
