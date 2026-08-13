"use client";

import { useEffect, useMemo, useState } from "react";
import { migrateProject } from "../project-schema.mjs";
import { createHomeAssistantExport } from "../ha-export-workflow.mjs";

const STORAGE_KEY = "floor-plan-studio-project";

export default function HomeAssistantExportPage() {
  const [project, setProject] = useState<any>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { setStatus("No saved project found. Return to the editor and save a project first."); return; }
      setProject(migrateProject(JSON.parse(raw)).project);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load the saved project.");
    }
  }, []);

  const result = useMemo(() => project ? createHomeAssistantExport(project) : null, [project]);

  const copyYaml = async () => {
    if (!result?.yaml) return;
    try { await navigator.clipboard.writeText(result.yaml); setStatus("Home Assistant YAML copied to clipboard."); }
    catch { setStatus("Copy failed. Select the YAML below and copy it manually."); }
  };

  const downloadYaml = () => {
    if (!result?.yaml) return;
    const url = URL.createObjectURL(new Blob([result.yaml], { type: "text/yaml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = result.filename; anchor.click(); URL.revokeObjectURL(url);
    setStatus(`Downloaded ${result.filename}.`);
  };

  return <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px 64px",fontFamily:"var(--font-geist-sans)"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:24}}>
      <div><p style={{fontSize:12,letterSpacing:1.2,fontWeight:700,margin:0}}>HOME ASSISTANT EXPORT</p><h1 style={{margin:"6px 0 0"}}>Picture-elements YAML</h1></div>
      <a href="/" style={{textDecoration:"none",fontWeight:700}}>← Back to editor</a>
    </div>

    <section style={{border:"1px solid #d8e0de",borderRadius:16,padding:20,marginBottom:18,background:"#fff"}}>
      <h2 style={{marginTop:0}}>Installation</h2>
      <p>Copy the complete YAML into a Home Assistant dashboard manual card. Clicking the generated light icon toggles its entity; the entire mapped room is colored only while that light entity is on. The export uses native Home Assistant elements only—no card-mod, HACS card, template, or app runtime is required.</p>
      <p style={{marginBottom:0}}><b>Known MVP limits:</b> binary on/off room lighting only; inline Base64 export; entity existence is not verified against your Home Assistant instance.</p>
    </section>

    {status && <div role="status" aria-live="polite" style={{padding:"12px 14px",borderRadius:10,background:"#eef5f3",marginBottom:18}}>{status}</div>}

    {result && <>
      <section style={{border:"1px solid #d8e0de",borderRadius:16,padding:20,marginBottom:18,background:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center"}}><h2 style={{margin:0}}>Validation</h2><span>{(result.bytes/1024).toFixed(1)} KiB</span></div>
        {!result.errors.length && <p style={{color:"#176b4d"}}>Ready to export.</p>}
        {!!result.errors.length && <ul>{result.errors.map((error:string)=><li key={error} style={{color:"#a92b2b"}}>{error}</li>)}</ul>}
        {!!result.warnings.length && <ul>{result.warnings.map((warning:string)=><li key={warning}>{warning}</li>)}</ul>}
      </section>

      <section style={{border:"1px solid #d8e0de",borderRadius:16,padding:20,background:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
          <h2 style={{margin:0}}>Generated YAML</h2>
          <div style={{display:"flex",gap:8}}><button onClick={copyYaml} disabled={!result.yaml}>Copy YAML</button><button onClick={downloadYaml} disabled={!result.yaml}>Download .yaml</button></div>
        </div>
        <textarea aria-label="Generated Home Assistant YAML" readOnly value={result.yaml || result.errors.join("\n")} style={{width:"100%",minHeight:520,fontFamily:"var(--font-geist-mono)",fontSize:12,lineHeight:1.45,padding:14,border:"1px solid #cfd8d5",borderRadius:10,resize:"vertical"}} />
      </section>
    </>}
  </main>;
}
