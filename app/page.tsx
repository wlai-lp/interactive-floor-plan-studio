"use client";

import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import packageJson from "../package.json";
import { toggleLightForDevice } from "./project-state.mjs";

type Point = { x: number; y: number };
type Room = { id: string; name: string; points: Point[]; color: string; light: boolean; temperature: number };
type Device = { id: string; roomId: string; x: number; y: number; type: "light" | "sensor" };
type Project = { name: string; width: number; height: number; image: string; rooms: Room[]; devices: Device[] };
type Snapshot = Pick<Project, "name" | "rooms" | "devices">;
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type Bounds = { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
type Gesture = {
  kind: "move" | "vertex" | "resize" | "device";
  roomId?: string;
  deviceId?: string;
  start: Point;
  snapshot: Snapshot;
  points: Point[];
  devices: Device[];
  bounds: Bounds;
  vertexIndex?: number;
  handle?: ResizeHandle;
  changed?: boolean;
};

const COLORS = ["#ffb86b", "#75d6b5", "#8ab8ff", "#ca9cff", "#ff8f9d", "#f8d86b"];
const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ||
  (process.env.NODE_ENV === "development" ? "0.0.0-dev" : packageJson.version);
const DEMO: Project = {
  name: "Sample project", width: 1000, height: 620, image: "",
  rooms: [
    { id: "living", name: "Living area", color: COLORS[0], light: true, temperature: 72, points: [{x:42,y:58},{x:958,y:58},{x:958,y:570},{x:380,y:570},{x:380,y:306},{x:42,y:306}] },
    { id: "room-1", name: "Room 1", color: COLORS[2], light: false, temperature: 69, points: [{x:42,y:320},{x:365,y:320},{x:365,y:570},{x:42,y:570}] },
  ],
  devices: [{id:"dev-1",roomId:"living",x:720,y:210,type:"light"},{id:"dev-2",roomId:"room-1",x:205,y:445,type:"sensor"}]
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const normalizeProject = (value: Omit<Project, "name"> & {name?: string}): Project => ({...value,name:value.name?.trim() || "Sample project"});
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || `room-${Date.now()}`;
const pointsAttr = (points: Point[]) => points.map(p => `${p.x},${p.y}`).join(" ");
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roomBounds = (points: Point[]): Bounds => {
  const xs = points.map(p => p.x); const ys = points.map(p => p.y);
  const minX = Math.min(...xs); const minY = Math.min(...ys); const maxX = Math.max(...xs); const maxY = Math.max(...ys);
  return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
};
const handlePoint = (b: Bounds, handle: ResizeHandle): Point => ({
  x: handle.includes("w") ? b.minX : handle.includes("e") ? b.maxX : (b.minX+b.maxX)/2,
  y: handle.includes("n") ? b.minY : handle.includes("s") ? b.maxY : (b.minY+b.maxY)/2,
});

export default function Home() {
  const [project, setProject] = useState<Project>(() => {
    if (typeof window === "undefined") return DEMO;
    const raw = localStorage.getItem("floor-plan-studio-project");
    if (!raw) return DEMO;
    try { return normalizeProject(JSON.parse(raw)); } catch { return DEMO; }
  });
  const [selected, setSelected] = useState("living");
  const [tool, setTool] = useState<"select"|"draw"|"device">("select");
  const [draft, setDraft] = useState<Point[]>([]);
  const [view, setView] = useState<"editor"|"playground">("editor");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const current = project.rooms.find(r => r.id === selected);
  const currentBounds = current ? roomBounds(current.points) : null;

  const stats = useMemo(() => ({rooms: project.rooms.length, devices: project.devices.length}), [project]);
  const snapshot = (): Snapshot => clone({name: project.name, rooms: project.rooms, devices: project.devices});
  const remember = () => { setHistory(h => [...h.slice(-39), snapshot()]); setFuture([]); setSaved(false); };
  const updateProject = (fn: (p: Project) => Project) => { remember(); setProject(fn); };
  const pointer = (event: PointerEvent<SVGElement>): Point => {
    const svg = svgRef.current!; const p = svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    const out = p.matrixTransform(svg.getScreenCTM()!.inverse()); return {x: Math.round(out.x), y: Math.round(out.y)};
  };
  const beginGesture = (e: PointerEvent<SVGElement>, room: Room, kind: Gesture["kind"], extras: Partial<Gesture> = {}) => {
    if (view !== "editor" || tool !== "select") return;
    e.stopPropagation(); e.preventDefault(); setSelected(room.id); setDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
    gestureRef.current = {kind,roomId:room.id,start:pointer(e),snapshot:snapshot(),points:clone(room.points),devices:clone(project.devices),bounds:roomBounds(room.points),...extras};
  };
  const beginDeviceGesture = (e: PointerEvent<SVGGElement>, device: Device) => {
    e.stopPropagation(); e.preventDefault(); setSelected(device.roomId);
    if (view !== "editor" || tool !== "select") { activateDevice(device); return; }
    setDragging(true); svgRef.current?.setPointerCapture(e.pointerId);
    gestureRef.current = {kind:"device",deviceId:device.id,start:pointer(e),snapshot:snapshot(),points:[],devices:clone(project.devices),bounds:{minX:0,minY:0,maxX:project.width,maxY:project.height,width:project.width,height:project.height}};
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const gesture = gestureRef.current; if (!gesture) return;
    const now = pointer(e); const dx = now.x-gesture.start.x; const dy = now.y-gesture.start.y;
    let nextPoints = clone(gesture.points); let nextDevices = clone(gesture.devices);
    if (gesture.kind === "device" && gesture.deviceId) {
      nextDevices = gesture.devices.map(d=>d.id===gesture.deviceId?{...d,x:clamp(d.x+dx,0,project.width),y:clamp(d.y+dy,0,project.height)}:d);
    } else if (gesture.kind === "move" && gesture.roomId) {
      const limitedX = clamp(dx,-gesture.bounds.minX,project.width-gesture.bounds.maxX);
      const limitedY = clamp(dy,-gesture.bounds.minY,project.height-gesture.bounds.maxY);
      nextPoints = gesture.points.map(p=>({x:p.x+limitedX,y:p.y+limitedY}));
      nextDevices = gesture.devices.map(d=>d.roomId===gesture.roomId?{...d,x:clamp(d.x+limitedX,0,project.width),y:clamp(d.y+limitedY,0,project.height)}:d);
    } else if (gesture.kind === "vertex" && gesture.vertexIndex !== undefined) {
      nextPoints[gesture.vertexIndex] = {x:clamp(now.x,0,project.width),y:clamp(now.y,0,project.height)};
    } else if (gesture.kind === "resize" && gesture.handle) {
      const b=gesture.bounds; let minX=b.minX, maxX=b.maxX, minY=b.minY, maxY=b.maxY; const h=gesture.handle;
      if(h.includes("w")) minX=clamp(now.x,0,maxX-12); if(h.includes("e")) maxX=clamp(now.x,minX+12,project.width);
      if(h.includes("n")) minY=clamp(now.y,0,maxY-12); if(h.includes("s")) maxY=clamp(now.y,minY+12,project.height);
      const sx=(maxX-minX)/Math.max(1,b.width), sy=(maxY-minY)/Math.max(1,b.height);
      const transform=(p:Point)=>({x:minX+(p.x-b.minX)*sx,y:minY+(p.y-b.minY)*sy});
      nextPoints=gesture.points.map(transform);
      nextDevices=gesture.devices.map(d=>d.roomId===gesture.roomId?{...d,...transform(d)}:d);
    }
    gesture.changed = true;
    setProject(old=>({...old,rooms:gesture.roomId?old.rooms.map(r=>r.id===gesture.roomId?{...r,points:nextPoints}:r):old.rooms,devices:nextDevices}));
    setSaved(false);
  };
  const endGesture = (e: PointerEvent<SVGSVGElement>) => {
    const gesture=gestureRef.current; if(!gesture)return;
    if(svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    if(gesture.changed){setHistory(h=>[...h.slice(-39),gesture.snapshot]);setFuture([])} gestureRef.current=null; setDragging(false);
  };
  const onCanvas = (e: PointerEvent<SVGSVGElement>) => {
    if (view !== "editor" || gestureRef.current) return;
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
    reader.onload = () => { const img = new Image(); img.onload = () => { remember(); setProject(p=>({...p,width:img.naturalWidth,height:img.naturalHeight,image:String(reader.result),rooms:[],devices:[]})); setSelected(""); }; img.src=String(reader.result); };
    reader.readAsDataURL(file); e.target.value="";
  };
  const undo = () => { const prev=history.at(-1); if(!prev)return; setFuture(f=>[snapshot(),...f]); setProject(p=>({...p,...clone(prev)})); setHistory(h=>h.slice(0,-1)); };
  const redo = () => { const next=future[0]; if(!next)return; setHistory(h=>[...h,snapshot()]); setProject(p=>({...p,...clone(next)})); setFuture(f=>f.slice(1)); };
  const download = (name:string, contents:string, type="application/json") => { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([contents],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href); };
  const exportSvg = () => download("floor-plan.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${project.width} ${project.height}" data-project-name="${project.name.replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]!))}"><title>${project.name}</title><g id="rooms">${project.rooms.map(r=>`<polygon id="${r.id}" data-room="${r.id}" points="${pointsAttr(r.points)}" fill="${r.color}" fill-opacity=".22" stroke="${r.color}"/>`).join("")}</g><g id="devices">${project.devices.map(d=>`<circle id="${d.id}" data-room="${d.roomId}" data-device-type="${d.type}" cx="${d.x}" cy="${d.y}" r="20"/>`).join("")}</g></svg>`, "image/svg+xml");
  const save = () => { localStorage.setItem("floor-plan-studio-project",JSON.stringify(project)); setSaved(true); setTimeout(()=>setSaved(false),1800); };
  const activateDevice = (device: Device) => {
    setSelected(device.roomId);
    if (view !== "playground" || device.type !== "light") return;
    updateProject(p=>toggleLightForDevice(p, device));
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { localStorage.setItem("floor-plan-studio-project",JSON.stringify(project)); setSaved(true); }, 250);
    return () => window.clearTimeout(timer);
  }, [project]);

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brandmark">◇</span><span>Floor Plan <b>Studio</b></span><span className="beta">LOCAL</span></a>
      <div className="view-switch" role="tablist"><button className={view==="editor"?"active":""} onClick={()=>setView("editor")}>Editor</button><button className={view==="playground"?"active":""} onClick={()=>setView("playground")}>Playground</button></div>
      <div className="header-actions"><span className="privacy"><i/> Private on this device</span><button className="secondary" onClick={save}>{saved?"Auto-saved ✓":"Save locally"}</button><button className="primary" onClick={()=>download("floor-plan.json",JSON.stringify(project,null,2))}>Export project</button></div>
    </header>

    <section className="workspace">
      <aside className="rail">
        <button className={tool==="select"?"active":""} onClick={()=>{setTool("select");setDraft([])}} title="Select and edit"><span>↖</span>Edit</button>
        <button className={tool==="draw"?"active":""} onClick={()=>setTool("draw")} title="Draw room"><span>⬡</span>Room</button>
        <button className={tool==="device"?"active":""} onClick={()=>setTool("device")} disabled={!current} title="Place device"><span>⌁</span>Device</button>
        <div className="rail-rule"/><button onClick={undo} disabled={!history.length}><span>↶</span>Undo</button><button onClick={redo} disabled={!future.length}><span>↷</span>Redo</button>
        <span className="app-version" title={`Interactive Floor Plan Studio v${APP_VERSION}`}>v{APP_VERSION}</span>
      </aside>

      <section className="stage-column">
        <div className="stage-top"><div><span className="eyebrow">{view==="editor"?"SEMANTIC EDITOR":"INTERACTIVE PREVIEW"}</span>{view==="editor"?<input className="project-name" aria-label="Project name" value={project.name} onChange={e=>{setSaved(false);setProject(p=>({...p,name:e.target.value}))}} onBlur={()=>setProject(p=>({...p,name:p.name.trim()||"Untitled project"}))}/>:<h1>{project.name}</h1>}</div><div className="stage-actions"><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/><button className="secondary" onClick={()=>fileRef.current?.click()}>↑ Upload image</button><button className="secondary" onClick={exportSvg}>↓ SVG</button></div></div>
        <div className={`canvas-wrap ${tool} ${dragging?"dragging":""}`}>
          <svg ref={svgRef} viewBox={`0 0 ${project.width} ${project.height}`} onPointerDown={onCanvas} onPointerMove={onPointerMove} onPointerUp={endGesture} onPointerCancel={endGesture} onDoubleClick={finishRoom} aria-label="Floor plan editor">
            <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#dce4e2" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="#f5f7f6"/>{!project.image&&<rect width="100%" height="100%" fill="url(#grid)"/>}
            {project.image&&<image href={project.image} width={project.width} height={project.height} preserveAspectRatio="xMidYMid meet"/>}
            {project.rooms.map(room=><g key={room.id} className={`room-shape ${selected===room.id?"selected":""} ${room.light?"lit":""}`} onPointerDown={e=>view==="editor"&&tool==="select"?beginGesture(e,room,"move"):(e.stopPropagation(),setSelected(room.id))}>
              <polygon points={pointsAttr(room.points)} style={{"--room":room.color} as React.CSSProperties}/>
              <text x={room.points.reduce((a,p)=>a+p.x,0)/room.points.length} y={room.points.reduce((a,p)=>a+p.y,0)/room.points.length}>{room.name}</text>
            </g>)}
            {view==="editor"&&tool==="select"&&current&&currentBounds&&<g className="shape-controls" aria-label={`Edit ${current.name}`}>
              <rect className="selection-box" x={currentBounds.minX} y={currentBounds.minY} width={currentBounds.width} height={currentBounds.height}/>
              {HANDLES.map(h=>{const p=handlePoint(currentBounds,h);return <rect key={h} className={`resize-handle handle-${h}`} x={p.x-7} y={p.y-7} width="14" height="14" rx="2" onPointerDown={e=>beginGesture(e,current,"resize",{handle:h})}/>})}
              {current.points.map((p,i)=><circle key={i} className="vertex-handle" cx={p.x} cy={p.y} r="8" onPointerDown={e=>beginGesture(e,current,"vertex",{vertexIndex:i})}/>) }
            </g>}
            {draft.length>0&&<><polyline className="draft-line" points={pointsAttr(draft)}/>{draft.map((p,i)=><circle className="draft-point" key={i} cx={p.x} cy={p.y} r="7"/> )}</>}
            {project.devices.map(d=>{const room=project.rooms.find(r=>r.id===d.roomId);const interactive=view==="playground"&&d.type==="light";const draggable=view==="editor"&&tool==="select";return <g key={d.id} className={`device-dot ${interactive?"interactive":""} ${draggable?"draggable":""} ${room?.light?"on":"off"}`} transform={`translate(${d.x} ${d.y})`} role={interactive?"button":undefined} tabIndex={interactive?0:undefined} aria-label={interactive?`${room?.name||"Room"} light: ${room?.light?"on":"off"}`:undefined} aria-pressed={interactive?Boolean(room?.light):undefined} onPointerDown={e=>beginDeviceGesture(e,d)} onKeyDown={e=>{if(interactive&&(e.key==="Enter"||e.key===" ")){e.preventDefault();e.stopPropagation();activateDevice(d)}}}><circle className="device-hit-area" r="24"/><circle className="device-face" r="20"/><text y="6">{d.type==="light"?"☼":"°"}</text></g>})}
          </svg>
          {tool==="draw"&&<div className="hint">Click around a room · Double-click to finish · {draft.length} points</div>}
          {tool==="select"&&current&&view==="editor"&&!dragging&&<div className="hint edit-hint">Drag rooms or devices · Use handles to resize and adjust corners</div>}
          {!project.rooms.length&&tool!=="draw"&&<div className="empty-card"><span>⬡</span><h2>Trace your first room</h2><p>Choose the Room tool, click each corner, then double-click to close the shape.</p><button className="primary" onClick={()=>setTool("draw")}>Start tracing</button></div>}
        </div>
        <footer className="statusbar"><span>{stats.rooms} rooms</span><span>{stats.devices} devices</span><span className="grow"/><span>Original coordinates · {project.width} × {project.height}</span></footer>
      </section>

      <aside className="inspector">
        <div className="inspector-title"><div><span className="eyebrow">INSPECTOR</span><h2>{current?.name || "Nothing selected"}</h2></div><span className="color-dot" style={{background:current?.color||"#ccd5d2"}}/></div>
        {current ? <>
          <div className="edit-callout"><b>Edit shape</b><p>Drag the room to move it. Use square handles to resize or round handles to adjust individual vertices.</p></div>
          <label>Room name<input value={current.name} onChange={e=>setProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,name:e.target.value}:r)}))} onBlur={remember}/></label>
          <div className="field"><span>Room ID</span><code>{current.id}</code></div>
          <div className="field"><span>Vertices</span><b>{current.points.length}</b></div>
          <div className="section-title">PLAYGROUND STATE</div>
          <button className={`toggle-row ${current.light?"on":""}`} onClick={()=>updateProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,light:!r.light}:r)}))}><span><i>☼</i> Light</span><b>{current.light?"ON":"OFF"}</b></button>
          <label>Temperature <span className="range-value">{current.temperature}°F</span><input type="range" min="55" max="85" value={current.temperature} onChange={e=>setProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,temperature:+e.target.value}:r)}))}/></label>
          <div className="section-title">ROOM COLOR</div><div className="swatches">{COLORS.map(c=><button key={c} className={current.color===c?"active":""} style={{background:c}} onClick={()=>updateProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,color:c}:r)}))}/>)}</div>
          <button className="danger" onClick={()=>{updateProject(p=>({...p,rooms:p.rooms.filter(r=>r.id!==current.id),devices:p.devices.filter(d=>d.roomId!==current.id)}));setSelected("")}}>Delete room</button>
        </>:<div className="inspector-empty">Select a room to edit its shape, label, status, color, and devices.</div>}
        <div className="privacy-card"><b>Built for privacy</b><p>Images and projects stay in your browser. Nothing is uploaded for processing.</p></div>
      </aside>
    </section>
  </main>;
}
