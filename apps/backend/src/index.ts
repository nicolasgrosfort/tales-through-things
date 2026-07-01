import cors from "cors";
import express from "express";
import { sendMessage } from "./utils/controller";
import { getLocalIp } from "./utils/helpers";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

app.get("/message", async (req, res) => {
  const question = req.query.question as string;
  const data = await sendMessage(question);
  res.json({ status: "ok", response: data.question, ready: data.ready });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://${getLocalIp()}:${port}`);
});
