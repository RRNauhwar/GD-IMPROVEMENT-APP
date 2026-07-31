import { useState } from "react";
import { loadApiKey, saveApiKey } from "../lib/storage";

export function Settings({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState(loadApiKey());
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="card">
      <h2>Settings</h2>
      <h4 className="mt">AI Coach (optional)</h4>
      <p className="small muted">
        The app works fully offline with a built-in analysis engine. To add
        richer, context-aware written feedback, paste your own OpenAI API key.
        It is stored only in this browser (localStorage) and sent directly to
        OpenAI from your device — it never touches any other server.
      </p>
      <label className="field mt">OpenAI API key</label>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-…"
        autoComplete="off"
      />
      <div className="row-actions mt" style={{ justifyContent: "flex-start" }}>
        <button className="primary" onClick={save}>Save</button>
        <button className="ghost" onClick={() => { setKey(""); saveApiKey(""); }}>
          Remove key
        </button>
        <button className="ghost" onClick={onClose}>Close</button>
        {saved && <span className="tag-good small">Saved ✓</span>}
      </div>
      <p className="small tag-warn mt">
        Note: any key placed in a browser app is visible to that browser. Use a
        key with usage limits, and never commit real keys to source control.
      </p>
    </div>
  );
}
