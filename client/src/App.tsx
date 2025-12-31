// client/src/App.tsx
import React from "react";

const API_URL = "http://localhost:4000/upload-file";
export default function App() {
  async function handleUpload(formData: FormData): Promise<void> {
    try {
      const response = await fetch(API_URL, {
        method: "post",
        body: formData,
      });

      if (response.ok) {
        showSnackbar("File uploaded successfully", "success");
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
          <button className="upload-section-form__action">Upload</button>
        </form>
      </div>
      <table>
        <thead></thead>
        <tbody></tbody>
      </table>
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
