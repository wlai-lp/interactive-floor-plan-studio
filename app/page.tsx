"use client";

import { ChangeEvent, PointerEvent, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };
type Room = { id: string; name: string; points: Point[]; color: string; light: boolean; temperature: number };
type Device = { id: string; roomId: string; x: number; y: number; type: "light" | "sensor" };
type Project = { width: number; height: number; image: string; rooms: Room[]; devices: Device[] };
type Snapshot = Pick<Project, "rooms" | "devices">;

const COLORS = ["#ffb86b", "#75d6b5", "#8ab8ff", "#ca9cff", "#ff8f9d", "#f8d86b"];
const DEMO: Project = {
  width: 1000, height: 620, image: "",
  rooms: [
    { id: "living", name: "Living area", color: COLORS[0], light: true, temperature: 72, points: [{x:42,y:58},{x:958,y:58},{x:958,y:570},{x:380,y:570},{x:380,y:306},{x:42,y:306}] },
    { id: "room-1", name: "Room 1", color: COLORS[2], light: false, temperature: 69, points: [{x:42,y:320},{x:365,y:320},{x:365,y:570},{x:42,y:570}] },
  ],
  devices: [{id:"dev-1",roomId:"living",x:720,y:210,type:"light"},{id:"dev-2",roomId:"room-1",x:205,y:445,type:"sensor"}]
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || `room-${Date.now()}`;
const pointsAttr = (points: Point[]) => points.map(p => `${p.x},${p.y}`).join(" ");

export default function Home() {
  const [project, setProject] = useState<Project>(() => {
    if (typeof window === "undefined") return DEMO;
    const raw = localStorage.getItem("floor-plan-studio-project");
    if (!raw) return DEMO;
    try { return JSON.parse(raw); } catch { return DEMO; }
  });
  const [selected, setSelected] = useState("living");
  const [tool, setTool] = useState<"select"|"draw"|"device">("select");
  const [draft, setDraft] = useState<Point[]>([]);
  const [view, setView] = useState<"editor"|"playground">("editor");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [saved, setSaved] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = project.rooms.find(r => r.id === selected);

  const stats = useMemo(() => ({rooms: project.rooms.length, devices: project.devices.length}), [project]);
  const remember = () => { setHistory(h => [...h.slice(-39), clone({rooms: project.rooms, devices: project.devices})]); setFuture([]); setSaved(false); };
  const updateProject = (fn: (p: Project) => Project) => { remember(); setProject(fn); };
  const pointer = (event: PointerEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current!; const p = svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    const out = p.matrixTransform(svg.getScreenCTM()!.inverse()); return {x: Math.round(out.x), y: Math.round(out.y)};
  };
  const onCanvas = (e: PointerEvent<SVGSVGElement>) => {
    if (view !== "editor") return;
    const p = pointer(e);
    if (tool === "draw") setDraft(d => [...d, p]);
    if (tool === "device" && current) {
      updateProject(old => ({...old, devices:[...old.devices,{id:`device-${Date.now()}`,roomId:current.id,x:p.x,y:p.y,type:"light"}]})); setTool("select");
    }
  };
  const finishRoom = () => {
    if (draft.length < 3) return;
    const name = `Room ${project.rooms.length + 1}`; const id = slug(`${name}-${Date.now()}`);
    updateProject(old => ({...old,rooms:[...old.rooms,{id,name,points:draft,color:COLORS[old.rooms.length%COLORS.length],light:false,temperature:70}]}));
    setSelected(id); setDraft([]); setTool("select");
  };
  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => { remember(); setProject({width:img.naturalWidth,height:img.naturalHeight,image:String(reader.result),rooms:[],devices:[]}); setSelected(""); }; img.src=String(reader.result); };
    reader.readAsDataURL(file); e.target.value="";
  };
  const undo = () => { const prev=history.at(-1); if(!prev)return; setFuture(f=>[clone({rooms:project.rooms,devices:project.devices}),...f]); setProject(p=>({...p,...clone(prev)})); setHistory(h=>h.slice(0,-1)); };
  const redo = () => { const next=future[0]; if(!next)return; setHistory(h=>[...h,clone({rooms:project.rooms,devices:project.devices})]); setProject(p=>({...p,...clone(next)})); setFuture(f=>f.slice(1)); };
  const download = (name:string, contents:string, type="application/json") => { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([contents],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href); };
  const exportSvg = () => download("floor-plan.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${project.width} ${project.height}"><g id="rooms">${project.rooms.map(r=>`<polygon id="${r.id}" data-room="${r.id}" points="${pointsAttr(r.points)}" fill="${r.color}" fill-opacity=".22" stroke="${r.color}"/>`).join("")}</g></svg>`, "image/svg+xml");
  const save = () => { localStorage.setItem("floor-plan-studio-project",JSON.stringify(project)); setSaved(true); setTimeout(()=>setSaved(false),1800); };

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brandmark">◇</span><span>Floor Plan <b>Studio</b></span><span className="beta">LOCAL</span></a>
      <div className="view-switch" role="tablist"><button className={view==="editor"?"active":""} onClick={()=>setView("editor")}>Editor</button><button className={view==="playground"?"active":""} onClick={()=>setView("playground")}>Playground</button></div>
      <div className="header-actions"><span className="privacy"><i/> Private on this device</span><button className="secondary" onClick={save}>{saved?"Saved ✓":"Save locally"}</button><button className="primary" onClick={()=>download("floor-plan.json",JSON.stringify(project,null,2))}>Export project</button></div>
    </header>

    <section className="workspace">
      <aside className="rail">
        <button className={tool==="select"?"active":""} onClick={()=>{setTool("select");setDraft([])}} title="Select"><span>↖</span>Select</button>
        <button className={tool==="draw"?"active":""} onClick={()=>setTool("draw")} title="Draw room"><span>⬡</span>Room</button>
        <button className={tool==="device"?"active":""} onClick={()=>setTool("device")} disabled={!current} title="Place device"><span>⌁</span>Device</button>
        <div className="rail-rule"/><button onClick={undo} disabled={!history.length}><span>↶</span>Undo</button><button onClick={redo} disabled={!future.length}><span>↷</span>Redo</button>
      </aside>

      <section className="stage-column">
        <div className="stage-top"><div><span className="eyebrow">{view==="editor"?"SEMANTIC EDITOR":"INTERACTIVE PREVIEW"}</span><h1>{project.image?"Your floor plan":"Sample project"}</h1></div><div className="stage-actions"><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/><button className="secondary" onClick={()=>fileRef.current?.click()}>↑ Upload image</button><button className="secondary" onClick={exportSvg}>↓ SVG</button></div></div>
        <div className={`canvas-wrap ${tool}`}>
          <svg ref={svgRef} viewBox={`0 0 ${project.width} ${project.height}`} onPointerDown={onCanvas} onDoubleClick={finishRoom} aria-label="Floor plan editor">
            <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#dce4e2" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="#f5f7f6"/>{!project.image&&<rect width="100%" height="100%" fill="url(#grid)"/>}
            {project.image&&<image href={project.image} width={project.width} height={project.height} preserveAspectRatio="xMidYMid meet"/>}
            {project.rooms.map(room=><g key={room.id} className={`room-shape ${selected===room.id?"selected":""} ${room.light?"lit":""}`} onPointerDown={e=>{e.stopPropagation();setSelected(room.id)}}>
              <polygon points={pointsAttr(room.points)} style={{"--room":room.color} as React.CSSProperties}/>
              <text x={room.points.reduce((a,p)=>a+p.x,0)/room.points.length} y={room.points.reduce((a,p)=>a+p.y,0)/room.points.length}>{room.name}</text>
            </g>)}
            {draft.length>0&&<><polyline className="draft-line" points={pointsAttr(draft)}/>{draft.map((p,i)=><circle className="draft-point" key={i} cx={p.x} cy={p.y} r="7"/> )}</>}
            {project.devices.map(d=><g key={d.id} className="device-dot" transform={`translate(${d.x} ${d.y})`} onPointerDown={e=>{e.stopPropagation();setSelected(d.roomId)}}><circle r="20"/><text y="6">{d.type==="light"?"☼":"°"}</text></g>)}
          </svg>
          {tool==="draw"&&<div className="hint">Click around a room · Double-click to finish · {draft.length} points</div>}
          {!project.rooms.length&&tool!=="draw"&&<div className="empty-card"><span>⬡</span><h2>Trace your first room</h2><p>Choose the Room tool, click each corner, then double-click to close the shape.</p><button className="primary" onClick={()=>setTool("draw")}>Start tracing</button></div>}
        </div>
        <footer className="statusbar"><span>{stats.rooms} rooms</span><span>{stats.devices} devices</span><span className="grow"/><span>Original coordinates · {project.width} × {project.height}</span></footer>
      </section>

      <aside className="inspector">
        <div className="inspector-title"><div><span className="eyebrow">INSPECTOR</span><h2>{current?.name || "Nothing selected"}</h2></div><span className="color-dot" style={{background:current?.color||"#ccd5d2"}}/></div>
        {current ? <>
          <label>Room name<input value={current.name} onChange={e=>setProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,name:e.target.value}:r)}))} onBlur={remember}/></label>
          <div className="field"><span>Room ID</span><code>{current.id}</code></div>
          <div className="field"><span>Vertices</span><b>{current.points.length}</b></div>
          <div className="section-title">PLAYGROUND STATE</div>
          <button className={`toggle-row ${current.light?"on":""}`} onClick={()=>updateProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,light:!r.light}:r)}))}><span><i>☼</i> Light</span><b>{current.light?"ON":"OFF"}</b></button>
          <label>Temperature <span className="range-value">{current.temperature}°F</span><input type="range" min="55" max="85" value={current.temperature} onChange={e=>setProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,temperature:+e.target.value}:r)}))}/></label>
          <div className="section-title">ROOM COLOR</div><div className="swatches">{COLORS.map(c=><button key={c} className={current.color===c?"active":""} style={{background:c}} onClick={()=>updateProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,color:c}:r)}))}/>)}</div>
          <button className="danger" onClick={()=>{updateProject(p=>({...p,rooms:p.rooms.filter(r=>r.id!==current.id),devices:p.devices.filter(d=>d.roomId!==current.id)}));setSelected("")}}>Delete room</button>
        </>:<div className="inspector-empty">Select a room to edit its label, status, color, and devices.</div>}
        <div className="privacy-card"><b>Built for privacy</b><p>Images and projects stay in your browser. Nothing is uploaded for processing.</p></div>
      </aside>
    </section>
  </main>;
}
