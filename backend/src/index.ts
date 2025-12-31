import express from "express";
import cors from "cors";
import { sequelize } from "./util/db";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { fileHanlder } from "./controllers/file-handler.controller";
import {
  addRow,
  deleteRow,
  listDatasets,
  previewDataset,
  updateRow,
} from "./controllers/dataset.controller";
import { queryDataset } from "./controllers/ai.controller";

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: "*" }));
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.get("/", (_req, res) => {
  res.send("Innovyne backend");
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV ?? "development" });
});
app.get("/datasets", listDatasets);
app.get("/datasets/:id/preview", previewDataset);
app.post("/datasets/:id/rows", addRow);
app.post("/datasets/:id/query", queryDataset);
app.patch("/datasets/:id/rows/:rowId", updateRow);
app.delete("/datasets/:id/rows/:rowId", deleteRow);

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR); // The folder on your file system
  },
  filename: (req, file, cb) => {
    // Generate a unique ID but keep the original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit (2025 safety standard)
});

app.post("/upload-file", upload.single("file"), fileHanlder);
sequelize
  .sync()
  .then((result) => {
    console.log("database result", result.json);
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
