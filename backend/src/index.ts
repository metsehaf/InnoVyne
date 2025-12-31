import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ credentials: true, origin: "*" }));
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.get("/", (_req, res) => {
  res.send("Innovyne backend");
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV ?? "development" });
});

app.post("/upload-file", (_req, res) => {
  console.log(_req.body);
  res.send("file uploaded");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
