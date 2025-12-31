// client/src/App.tsx
import React, { useEffect } from "react";

const API_URL = "http://localhost:4000/upload-file";
export default function App() {
  async function handleUpload(formaData: FormData) {
    await fetch(API_URL, {
      method: "post",
      body: formaData,
    });
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload a file</h1>
      <div className="upload-section">
        <form
          className="upload-section-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await handleUpload(formData);
          }}
        >
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
