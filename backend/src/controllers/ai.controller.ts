// backend/src/controllers/ai.controller.ts
import { Request, Response } from "express";
import { DataRow } from "../models/dataRow";
import { Dataset } from "../models/dataset";

const safeJSONParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Call Google AI Studio generateText endpoint
 */
async function callGoogleModel(prompt: string) {
  const model = process.env.GOOGLE_MODEL ?? "text-bison-001";
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText?key=${key}`;

  const body = {
    prompt: { text: prompt },
    temperature: 0,
    maxOutputTokens: 500,
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Google API error ${r.status}: ${txt}`);
  }

  const j = await r.json();
  return j?.candidates?.[0]?.output ?? JSON.stringify(j);
}

/**
 * Call Hugging Face Inference API
 */
async function callHFModel(prompt: string) {
  const model = process.env.HF_MODEL || "google/flan-t5-large";
  const res = await fetch(`https://router.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.0 },
    }),
  });
  const data = await res.json();
  // parse generated_text or appropriate field depending on model
  return (
    data?.generated_text ??
    (Array.isArray(data) ? data[0]?.generated_text : JSON.stringify(data))
  );
}

/**
 * Provider switcher
 */
async function callModel(prompt: string) {
  const provider = (process.env.AI_PROVIDER || "google").toLowerCase();
  if (provider === "google") return await callGoogleModel(prompt);
  if (provider === "hf" || provider === "huggingface")
    return await callHFModel(prompt);
  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

export const queryDataset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { query, top_k = 50 } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });

    // quick env check (fail fast with useful message)
    if (
      (process.env.AI_PROVIDER || "google").toLowerCase() === "google" &&
      !process.env.GOOGLE_API_KEY
    ) {
      return res.status(503).json({ error: "GOOGLE_API_KEY not set" });
    }

    const dataset = await Dataset.findByPk(id);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    // sample rows
    const rows = await DataRow.findAll({
      where: { dataset_id: id },
      limit: Math.min(top_k, 200),
      order: [["id", "ASC"]],
    });
    const sample = rows.map((r) => r.get("data"));

    // summary + basic numeric stats
    const columns = (dataset.get("columns") || []) as string[];
    const summaryParts: string[] = [`Columns: ${columns.join(", ")}`];
    for (const col of columns) {
      const nums = sample
        .map((r: any) => Number(r[col]))
        .filter((v) => !Number.isNaN(v));
      if (nums.length) {
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        summaryParts.push(
          `${col} → min ${min}, max ${max}, mean ${mean.toFixed(2)}`
        );
      }
    }

    // assemble prompt context
    const contextText = [
      `Dataset: ${dataset.get("original_name")} (rows: ${dataset.get(
        "row_count"
      )})`,
      `Summary:\n${summaryParts.join("\n")}`,
      "Sample rows (first 10):",
      JSON.stringify(sample.slice(0, 10), null, 2),
    ].join("\n\n");

    const system = `You are a data assistant. Answer succinctly and, if requested, return JSON. Use only the provided context when possible.`;
    const user = `Context:\n${contextText}\n\nQuestion: ${query}\n\nIf the question is purely a numeric aggregation, try to compute it from the summary. Otherwise, answer using the sample rows; say if you are uncertain because the sample may be incomplete. Return JSON if asked.`;
    const prompt = `${system}\n\n${user}`;

    // call chosen provider
    const raw = await callModel(prompt);
    const parsed = safeJSONParse(raw);

    return res.json({ answer: parsed ?? raw, raw });
  } catch (err: any) {
    console.error("AI query error:", err.message ?? err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
};
