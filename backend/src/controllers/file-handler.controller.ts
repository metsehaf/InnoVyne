import { Request, Response } from "express";
import { Upload } from "../models/upload";
import crypto from "crypto";
import fs from "fs";

// refine req type so TS knows about multer file
export const fileHanlder = async (
  req: Request & { file?: Express.Multer.File },
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Prepare metadata for your Hybrid Storage DB
    const fileMetadata = {
      original_name: req.file.originalname,
      storage_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_at: new Date(),
    };
    const filePath = req.file.path;

    // compute SHA-256 hash from file stream
    const computeHash = (path: string): Promise<string> =>
      new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const rs = fs.createReadStream(path);
        rs.on("error", reject);
        rs.on("data", (chunk) => hash.update(chunk));
        rs.on("end", () => resolve(hash.digest("hex")));
      });

    const fileHash = await computeHash(filePath);
    const file = await Upload.create({
      original_name: fileMetadata.original_name,
      storage_path: fileMetadata.storage_path,
      file_size: fileMetadata.file_size,
      mime_type: fileMetadata.mime_type,
      uploaded_at: fileMetadata.uploaded_at,
      hash: fileHash,
    });

    res.status(201).json({
      message: "File uploaded and metadata saved.",
      fileId: file.get("id"),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
