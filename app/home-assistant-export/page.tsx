"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { migrateProject } from "../project-schema.mjs";
import { createHomeAssistantExport } from "../ha-export-workflow.mjs";
import "./ha-export-page.css";

const STORAGE_KEY = "floor-plan-studio-project";
const deviceIdFromError = (error: string) => error.match(/^Device ([^:]+):/)?.[1];

export default function HomeAssistantExportPage() {
  const [{ project, loadError }] = useState(() => {
    if (typeof window === "undefined") return { project: null, loadError: "" };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { project: null, loadError: "No saved project found. Return to the editor and save a project first." };
      return { project: migrateProject(JSON.parse(raw)).project as { name: string }, loadError: "" };
    } catch (error) {
      return { project: null, loadError: error instanceof Error ? error.message : "Unable to load the saved project." };
    }
  });
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => project ? createHomeAssistantExport(project) : null, [project]);

  const copyYaml = async () => {
    if (!result?.yaml) return;
    try {
      await navigator.clipboard.writeText(result.yaml);
      setCopied(true);
      setFeedback("Copied to clipboard. Paste the YAML into your Home Assistant dashboard configuration.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setFeedback("Copy failed. Select the YAML below and copy it manually.");
    }
  };

  const downloadYaml = () => {
    if (!result?.yaml) return;
    const url = URL.createObjectURL(new Blob([result.yaml], { type: "text/yaml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback(`Downloaded ${result.filename}.`);
  };

  const actions = (className = "") => <div className={`export-actions ${className}`}>
    <button className="export-button primary-action" onClick={copyYaml} disabled={!result?.yaml}>{copied ? "✓ YAML copied" : "Copy YAML to clipboard"}</button>
    <button className="export-button secondary-action" onClick={downloadYaml} disabled={!result?.yaml}>Download YAML file</button>
  </div>;

  return <div className="ha-export-shell">
    <header className="topbar ha-export-topbar">
      <Link className="brand" href="/"><span className="brandmark">◇</span><span>Floor Plan <b>Studio</b></span><span className="beta">LOCAL</span></Link>
      <div className="header-actions"><span className="privacy"><i/> Private on this device</span><Link className="back-link" href="/">← Back to editor</Link></div>
    </header>

    <main className="ha-export-main">
      <div className="export-heading"><div><span className="eyebrow">HOME ASSISTANT</span><h1>Export to Home Assistant</h1><p>{project ? <>Generate a native picture-elements configuration for <b>{project.name}</b>.</> : "Generate a native picture-elements configuration from your saved project."}</p></div></div>

      {loadError && <section className="export-card empty-export" role="alert"><h2>Project unavailable</h2><p>{loadError}</p><Link className="back-link" href="/">Return to editor</Link></section>}

      {result && <div className="export-grid">
        <section className="export-card yaml-card">
          <div className="export-card-header"><h2>Generated YAML</h2><span className="yaml-size">{(result.bytes / 1024).toFixed(1)} KiB</span></div>
          {actions("mobile-actions")}
          <textarea className={`yaml-panel ${!result.yaml ? "error-output" : ""}`} aria-label="Generated Home Assistant YAML" readOnly spellCheck={false} value={result.yaml || "Resolve the configuration issues shown in Readiness, then return here to export."}/>
        </section>

        <aside className="export-sidebar">
          <section className="export-card">
            <h2>Readiness</h2>
            {!result.errors.length ? <ul className="readiness"><li>✓ Entity IDs configured</li><li>✓ Room overlays mapped</li><li>✓ YAML ready</li></ul> : <>
              <p>Resolve these items before exporting:</p>
              <ul className="validation-list">{result.errors.map((error: string) => { const deviceId=deviceIdFromError(error); return <li key={error} className="error">{error}{deviceId&&<> <Link className="correction-link" href={`/?device=${encodeURIComponent(deviceId)}`}>Select device</Link></>}</li> })}</ul>
              <Link className="back-link" href="/">Back to editor</Link>
            </>}
            {!!result.warnings.length&&<ul className="validation-list">{result.warnings.map((warning:string)=><li key={warning}>{warning}</li>)}</ul>}
          </section>

          <section className="export-card">
            <h2>Use in Home Assistant</h2>
            <p>Copy the complete configuration and paste it where Home Assistant accepts a full Lovelace card configuration. It generates a native <code>picture-elements</code> card—no card-mod, HACS card, template, or app runtime is required.</p>
            <p className="installation-note"><b>MVP:</b> binary on/off room lighting with inline Base64 assets. Entity existence is not verified against your Home Assistant instance.</p>
          </section>

          {actions("desktop-actions")}
          {feedback&&<p className="export-status" role="status" aria-live="polite">{feedback}</p>}
        </aside>
      </div>}
    </main>
  </div>;
}
