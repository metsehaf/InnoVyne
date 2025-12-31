import { Request, Response } from "express";
import { Upload } from "../models/upload";
import crypto from "crypto";
import fs from "fs";
import csv from "csv-parser";
import { Dataset } from "../models/dataset";
import { DataRow } from "../models/dataRow";

export const fileHanlder = async (
  req: Request & { file?: Express.Multer.File },
  res: Response
) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const batchSize = 500;
    const hash = crypto.createHash("sha256");

    // create dataset early with placeholders so we can attach rows as we parse
    const dataset = await Dataset.create({
      original_name: req.file.originalname,
      storage_path: filePath,
      columns: [],
      row_count: 0,
    });

    let rowCount = 0;
    let columns: string[] = [];
    let batch: Array<{ dataset_id: string; data: any }> = [];
    const rs = fs.createReadStream(filePath);

    // stream parser wrapped in a promise to await completion/errors
    await new Promise<void>((resolve, reject) => {
      rs.on("data", (chunk) => hash.update(chunk));
      rs.on("error", reject);

      const parser = rs.pipe(csv());
      parser.on("error", reject);

      parser.on("data", async (row) => {
        rowCount++;
        if (rowCount === 1) columns = Object.keys(row);

        batch.push({ dataset_id: String(dataset.get("id")), data: row });

        if (batch.length >= batchSize) {
          parser.pause();
          try {
            await DataRow.bulkCreate(batch);
            batch = [];
          } catch (err) {
            return reject(err);
          } finally {
            parser.resume();
          }
        }
      });

      parser.on("end", async () => {
        try {
          if (batch.length) await DataRow.bulkCreate(batch);
          const fileHash = hash.digest("hex");

          // create Upload record (metadata + hash)
          const upload = await Upload.create({
            original_name: req.file!.originalname,
            storage_path: filePath,
            file_size: req.file!.size,
            mime_type: req.file!.mimetype,
            uploaded_at: new Date(),
            hash: fileHash,
          });

          // update dataset with final columns and count
          await dataset.update({ columns, row_count: rowCount });

          // single final response
          res.status(201).json({
            datasetId: dataset.get("id"),
            fileId: upload.get("id"),
            rowCount,
          });

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error: any) {
    console.error("upload error:", error);
    return res.status(500).json({ error: error.message });
  }
};
