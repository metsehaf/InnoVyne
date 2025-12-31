// client/src/App.tsx
import React, { useEffect, useState } from "react";
import Aside from "./components/aside-element/aside";

const API = "http://localhost:4000";

type DatasetSummary = {
  id: string;
  original_name: string;
  row_count: number;
  columns?: string[];
};

type Row = {
  id?: string;
  [key: string]: any;
};

export default function App() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{
    rowId?: string;
    col?: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [newRow, setNewRow] = useState<Record<string, string>>({});
  // file upload unchanged (keeps your handleUpload/onSubmit)
  const API_URL = `${API}/upload-file`;
  async function handleUpload(formData: FormData): Promise<void> {
    try {
      const response = await fetch(API_URL, {
        method: "post",
        body: formData,
      });

      if (response.ok) {
        showSnackbar("File uploaded successfully", "success");
        await fetchDatasets();
      } else {
        showSnackbar("Upload failed", "error");
      }
    } catch (error) {
      showSnackbar("Upload error", "error");
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[name="file"]');
    if (!input?.files?.length) {
      alert("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("file", input.files[0]);
    await handleUpload(formData);
  };

  // Fetch dataset list
  async function fetchDatasets() {
    try {
      const res = await fetch(`${API}/datasets?page=1&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch datasets");
      const body = await res.json();
      setDatasets(body.datasets ?? []);
    } catch (err) {
      console.warn(err);
      setDatasets([]);
    }
  }

  // Fetch preview rows (server endpoint should return { columns, rows })
  async function fetchPreview(datasetId: string) {
    try {
      const res = await fetch(`${API}/datasets/${datasetId}/preview?limit=200`);
      if (!res.ok) throw new Error("Failed to fetch preview");
      const body = await res.json();
      setColumns(body.columns ?? []);
      setRows(body.rows ?? []);
      setFilters({});
      setNewRow({});
    } catch (err) {
      console.warn(err);
      setColumns([]);
      setRows([]);
    }
  }

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selected) fetchPreview(selected);
    else {
      setColumns([]);
      setRows([]);
    }
  }, [selected]);

  // Filtering (client-side)
  const visibleRows = rows.filter((r) =>
    columns.every((c) => {
      const f = (filters[c] || "").trim().toLowerCase();
      if (!f) return true;
      const val = (r[c] ?? "").toString().toLowerCase();
      return val.includes(f);
    })
  );

  // Inline edit handlers
  const startEdit = (rowId: string | undefined, col: string) => {
    setEditing({ rowId, col });
    const row = rows.find((r) => r.id === rowId) ?? {};
    setEditingValue(String(row[col] ?? ""));
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditingValue("");
  };

  const saveEdit = async (rowId: string | undefined, col: string) => {
    // optimistic update
    const prev = rows;
    const newRows = rows.map((r) =>
      r.id === rowId ? { ...r, [col]: editingValue } : r
    );
    setRows(newRows);
    setEditing(null);

    try {
      // PATCH endpoint expected: /datasets/:id/rows/:rowId
      if (!rowId) throw new Error("No rowId");
      const resp = await fetch(`${API}/datasets/${selected}/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { [col]: editingValue } }),
      });
      if (!resp.ok) throw new Error("Save failed");
      showSnackbar("Saved", "success");
    } catch (err) {
      showSnackbar("Save failed", "error");
      setRows(prev); // revert
    }
  };

  // Add new row
  const addRow = async () => {
    const payload: any = {};
    columns.forEach((c) => (payload[c] = newRow[c] ?? ""));
    try {
      const resp = await fetch(`${API}/datasets/${selected}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      if (!resp.ok) throw new Error("Add failed");
      const body = await resp.json();
      // server should return created row with id and data
      setRows((prev) => [body.row, ...prev]);
      setNewRow({});
      showSnackbar("Row added", "success");
    } catch (err) {
      showSnackbar("Add failed", "error");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload a file</h1>
      <div className="upload-section">
        <form className="upload-section-form" onSubmit={onSubmit}>
          <label className="upload-section-form--label" htmlFor="file">
            File
          </label>
          <input id="file" name="file" type="file" />
          <br />
          <br />
          <button type="submit" className="upload-section-form__action">
            Upload
          </button>
        </form>
      </div>

      <section style={{ margin: "0 2rem 2rem 2rem" }}>
        <label>
          <strong>Dataset:</strong>{" "}
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
          >
            <option value="">-- select dataset --</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.original_name} ({d.row_count})
              </option>
            ))}
          </select>
          <button onClick={() => fetchDatasets()} style={{ marginLeft: 8 }}>
            Refresh
          </button>
        </label>
      </section>

      {columns.length > 0 && (
        <div style={{ padding: "0 2rem 2rem 2rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>
                    <div>{c}</div>
                    <input
                      placeholder="Filter..."
                      value={filters[c] ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, [c]: e.target.value }))
                      }
                      className="col-filter"
                    />
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Add row form */}
              <tr className="add-row">
                {columns.map((c) => (
                  <td key={c}>
                    <input
                      value={newRow[c] ?? ""}
                      onChange={(e) =>
                        setNewRow((nr) => ({ ...nr, [c]: e.target.value }))
                      }
                    />
                  </td>
                ))}
                <td>
                  <button onClick={addRow}>Add</button>
                </td>
              </tr>

              {visibleRows.map((r) => (
                <tr key={r.id ?? JSON.stringify(r)}>
                  {columns.map((c) => {
                    const isEditing =
                      editing?.rowId === r.id && editing?.col === c;
                    return (
                      <td
                        key={c}
                        onDoubleClick={() => startEdit(r.id, c)}
                        className="cell"
                      >
                        {isEditing ? (
                          <input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => saveEdit(r.id, c)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(r.id, c);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                        ) : (
                          <span>{String(r[c] ?? "")}</span>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <button onClick={() => startEdit(r.id, columns[0])}>
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const resp = await fetch(
                            `${API}/datasets/${selected}/rows/${r.id}`,
                            { method: "DELETE" }
                          );
                          if (!resp.ok) throw new Error();
                          setRows((prev) => prev.filter((x) => x.id !== r.id));
                          showSnackbar("Deleted", "success");
                        } catch {
                          showSnackbar("Delete failed", "error");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Aside datasetId={selected || undefined} />
    </div>
  );
}

function showSnackbar(message: string, type: "success" | "error") {
  const snackbar = document.createElement("div");
  snackbar.textContent = message;
  snackbar.style.position = "fixed";
  snackbar.style.bottom = "20px";
  snackbar.style.right = "20px";
  snackbar.style.padding = "12px 20px";
  snackbar.style.borderRadius = "4px";
  snackbar.style.color = "white";
  snackbar.style.backgroundColor = type === "success" ? "#4caf50" : "#f44336";
  snackbar.style.zIndex = "1000";

  document.body.appendChild(snackbar);

  setTimeout(() => snackbar.remove(), 3000);
}
