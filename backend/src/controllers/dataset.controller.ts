// backend/src/controllers/dataset.controller.ts
import { Request, Response } from "express";
import { Dataset } from "../models/dataset";
import { DataRow } from "../models/dataRow";
import { sequelize } from "../util/db";

export const listDatasets = async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Dataset.findAndCountAll({
      attributes: [
        "id",
        "original_name",
        "row_count",
        "columns",
        "uploaded_at",
      ],
      order: [["uploaded_at", "DESC"]],
      limit,
      offset,
    });

    res.json({
      total: count,
      page,
      limit,
      datasets: rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /datasets/:id/preview?limit=200
 * Returns dataset columns + first `limit` rows (rows returned as { id, ...data })
 */
export const previewDataset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(1000, Number(req.query.limit) || 200);

    const dataset = await Dataset.findByPk(id);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    const rows = await DataRow.findAll({
      where: { dataset_id: id },
      limit,
      order: [["id", "ASC"]],
    });

    const mapped = rows.map((r) => ({
      id: r.get("id"),
      ...(r.get("data") as object),
    }));

    res.json({
      columns: dataset.get("columns") ?? [],
      rows: mapped,
      rowCount: dataset.get("row_count"),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /datasets/:id/rows
 * Body: { data: { ... } }
 * Creates a row and increments dataset.row_count (atomic via transaction)
 */
export const addRow = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const payload = req.body?.data;
    if (!payload || typeof payload !== "object")
      return res.status(400).json({ error: "Body must be { data: {...} }" });

    const dataset = await Dataset.findByPk(id, { transaction: t });
    if (!dataset) {
      await t.rollback();
      return res.status(404).json({ error: "Dataset not found" });
    }

    const row = await DataRow.create(
      { dataset_id: id, data: payload },
      { transaction: t }
    );

    await dataset.increment("row_count", { by: 1, transaction: t });
    await t.commit();

    res
      .status(201)
      .json({ row: { id: row.get("id"), ...(row.get("data") as object) } });
  } catch (err: any) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /datasets/:id/rows/:rowId
 * Body: { data: { col: newValue, ... } }
 * Merges with existing row.data and returns updated row
 */
export const updateRow = async (req: Request, res: Response) => {
  try {
    const { id: datasetId, rowId } = req.params;
    const patch = req.body?.data;
    if (!patch || typeof patch !== "object")
      return res.status(400).json({ error: "Body must be { data: {...} }" });

    const row = await DataRow.findByPk(rowId);
    if (!row) return res.status(404).json({ error: "Row not found" });
    if (String(row.get("dataset_id")) !== datasetId)
      return res.status(400).json({ error: "Row does not belong to dataset" });

    const current = (row.get("data") || {}) as Record<string, any>;
    const updated = { ...current, ...patch };
    await row.update({ data: updated });

    res.json({ row: { id: row.get("id"), ...updated } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /datasets/:id/rows/:rowId
 * Deletes the row and decrements dataset.row_count atomically
 */
export const deleteRow = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { id: datasetId, rowId } = req.params;

    const row = await DataRow.findByPk(rowId, { transaction: t });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ error: "Row not found" });
    }
    if (String(row.get("dataset_id")) !== datasetId) {
      await t.rollback();
      return res.status(400).json({ error: "Row does not belong to dataset" });
    }

    await row.destroy({ transaction: t });
    const dataset = await Dataset.findByPk(datasetId, { transaction: t });
    if (dataset)
      await dataset.decrement("row_count", { by: 1, transaction: t });
    await t.commit();

    res.status(204).send();
  } catch (err: any) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};
