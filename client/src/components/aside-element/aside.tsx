import React, { useState } from "react";
import "./aside.css";

type Props = {
  datasetId?: string;
  apiBase?: string; // optional override for API base URL
  onAnswer?: (payload: any) => void;
};

export default function Aside({
  datasetId,
  apiBase = "http://localhost:4000",
  onAnswer,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSideBar = () => {
    // On small screens prefer fullscreen toggle
    if (window.innerWidth < 800) {
      setIsFullscreen((s) => !s);
    } else {
      setIsCollapsed((s) => !s);
    }
  };

  const toggleFullscreen = () => setIsFullscreen((s) => !s);

  const ask = async () => {
    if (!datasetId) {
      alert("Select a dataset first (from the dataset dropdown).");
      return;
    }
    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const resp = await fetch(`${apiBase}/datasets/${datasetId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, top_k: 100 }),
      });

      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "AI provider error");

      const content = body.answer ?? body.raw ?? "No answer";
      setAnswer(content);
      if (onAnswer) onAnswer(body);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
        isFullscreen ? "fullscreen" : "docked"
      }`}
      aria-expanded={!isCollapsed}
    >
      <div className="sidebar-header">
        <h2 className="sidebar-title">AI Assistant</h2>
        <div className="sidebar-controls">
          <button
            onClick={toggleSideBar}
            className="sidebar-toggle"
            aria-label="toggle sidebar"
          >
            {isCollapsed ? "Open" : "Close"}
          </button>
          <button
            onClick={toggleFullscreen}
            className="sidebar-fullscreen"
            aria-label="toggle fullscreen"
          >
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className="sidebar-body">
        <textarea
          id="question"
          name="ai-question"
          rows={6}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about the dataset... (e.g. 'Summarize sales by product')"
        />

        <div className="sidebar-actions">
          <button className="ask-btn" onClick={ask} disabled={isLoading}>
            {isLoading ? "Asking..." : "Ask"}
          </button>
        </div>

        <div className="ai-response">
          {isLoading && <div className="ai-loading">Loading…</div>}
          {error && <div className="ai-error">Error: {error}</div>}
          {answer && (
            <div className="ai-answer">
              {typeof answer === "object" ? (
                <pre>{JSON.stringify(answer, null, 2)}</pre>
              ) : (
                <pre>{String(answer)}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
