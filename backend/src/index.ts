import express from "express";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.get("/", (_req, res) => {
  res.send("Innovyne backend");
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV ?? "development" });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
