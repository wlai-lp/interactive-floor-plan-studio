"use client";

import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import packageJson from "../package.json";
import { toggleLightForDevice } from "./project-state.mjs";
import { createDefaultHaDeviceConfig, createDefaultHomeAssistantSettings, inferLightOverlay, migrateProject, upsertDeviceOverlay, validateHaDeviceConfig, validateProjectV2 } from "./project-schema.mjs";
import "./editor-actions-inspector.css";

type Point = { x: number; y: number };
type Room = { id: string; name: string; points: Point[]; color: string; light: boolean; temperature: number };
type HaActionName = "none" | "more-info" | "toggle";
type HaAction = { action: HaActionName };
type HaDeviceConfig = {
  entityId: string;
  title: string;
  mode: "state-icon" | "state-label" | "icon-and-label";
  label: { enabled: boolean; offsetY: number; fontSizePx: number; color: string };
  icon: string;
  iconSizePx: number;
  tapAction: HaAction;
  holdAction: HaAction;
  doubleTapAction: HaAction;
};
type HaOverlay = { id: string; entityId: string; state: "on"; roomIds: string[]; fill: string; opacity: number; blurPx: number; mappingSource?: "inferred"|"explicit" };
type Device = { id: string; roomId: string; x: number; y: number; type: "light" | "sensor"; ha?: HaDeviceConfig };
type Project = { schemaVersion: 2; name: string; width: number; height: number; image: string; rooms: Room[]; devices: Device[]; homeAssistant: { background: "rooms-and-uploaded-image"; overlays: HaOverlay[] } };
type Snapshot = Pick<Project, "name" | "rooms" | "devices" | "homeAssistant">;
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
const ACTIONS: HaActionName[] = ["none", "more-info", "toggle"];
const STORAGE_KEY = "floor-plan-studio-project";
const V1_BACKUP_KEY = "floor-plan-studio-project:v1-backup";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || (process.env.NODE_ENV === "development" ? "0.0.0-dev" : packageJson.version);
const WELCOME_KEY = "floor-plan-studio-ha-welcome-dismissed";
const DEMO: Project = {
  schemaVersion: 2,
  name: "Sample project", width: 1000, height: 620, image: "",
  rooms: [
    { id: "living", name: "Living area", color: COLORS[0], light: true, temperature: 72, points: [{x:42,y:58},{x:958,y:58},{x:958,y:570},{x:380,y:570},{x:380,y:306},{x:42,y:306}] },
    { id: "room-1", name: "Room 1", color: COLORS[2], light: false, temperature: 69, points: [{x:42,y:320},{x:365,y:320},{x:365,y:570},{x:42,y:570}] },
  ],
  devices: [{id:"dev-1",roomId:"living",x:720,y:210,type:"light"},{id:"dev-2",roomId:"room-1",x:205,y:445,type:"sensor"}],
  homeAssistant: createDefaultHomeAssistantSettings() as Project["homeAssistant"],
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
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
  const [initialLoad] = useState(() => {
    if (typeof window === "undefined") return { project: DEMO, notice: "", autosave: true };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { project: DEMO, notice: "", autosave: true };
    try {
      const parsed = JSON.parse(raw);
      const result = migrateProject(parsed);
      if (result.migrated && !localStorage.getItem(V1_BACKUP_KEY)) localStorage.setItem(V1_BACKUP_KEY, raw);
      return { project: result.project as Project, notice: result.migrated ? "Legacy project upgraded to schema v2. A v1 backup was retained." : "", autosave: true };
    } catch (error) {
      return { project: DEMO, notice: `Saved project was not overwritten because it could not be loaded: ${error instanceof Error ? error.message : "invalid project"}`, autosave: false };
    }
  });
  const [project, setProject] = useState<Project>(initialLoad.project);
  const [initialSelection] = useState(() => {
    if (typeof window === "undefined") return { roomId: "living", deviceId: "" };
    const deviceId = new URLSearchParams(window.location.search).get("device");
    const device = initialLoad.project.devices.find(item => item.id === deviceId);
    return device ? { roomId: device.roomId, deviceId: device.id } : { roomId: "living", deviceId: "" };
  });
  const [loadNotice, setLoadNotice] = useState(initialLoad.notice);
  const [autosaveEnabled, setAutosaveEnabled] = useState(initialLoad.autosave);
  const [selected, setSelected] = useState(initialSelection.roomId);
  const [selectedDevice, setSelectedDevice] = useState(initialSelection.deviceId);
  const [tool, setTool] = useState<"select"|"draw"|"device">("select");
  const [draft, setDraft] = useState<Point[]>([]);
  const [view, setView] = useState<"editor"|"playground">("editor");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(() => typeof window !== "undefined" && initialLoad.project.devices.length > 0 && localStorage.getItem(WELCOME_KEY) !== "true");
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const projectFileRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const current = project.rooms.find(r => r.id === selected);
  const currentDevice = project.devices.find(d => d.id === selectedDevice);
  const currentBounds = current ? roomBounds(current.points) : null;
  const currentHaErrors = currentDevice?.ha ? validateHaDeviceConfig(currentDevice.ha, "Home Assistant") : [];
  const currentOverlay = currentDevice?.ha?.entityId ? project.homeAssistant.overlays.find(o => o.entityId === currentDevice.ha?.entityId) : undefined;
  const entityError = currentHaErrors.find(error => /entity/i.test(error));
  const hasHaExport = project.devices.some(device => Boolean(device.ha?.entityId));
  const entitySetupDevice = project.devices.find(device => !device.ha?.entityId) || project.devices[0];

  const stats = useMemo(() => ({rooms: project.rooms.length, devices: project.devices.length}), [project]);
  const snapshot = (): Snapshot => clone({name: project.name, rooms: project.rooms, devices: project.devices, homeAssistant: project.homeAssistant});
  const remember = () => { setHistory(h => [...h.slice(-39), snapshot()]); setFuture([]); setSaved(false); };
  const updateProject = (fn: (p: Project) => Project) => { remember(); setProject(fn); };
  const pointer = (event: PointerEvent<SVGElement>): Point => {
    const svg = svgRef.current!; const p = svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    const out = p.matrixTransform(svg.getScreenCTM()!.inverse()); return {x: Math.round(out.x), y: Math.round(out.y)};
  };
  const beginGesture = (e: PointerEvent<SVGElement>, room: Room, kind: Gesture["kind"], extras: Partial<Gesture> = {}) => {
    if (view !== "editor" || tool !== "select") return;
    e.stopPropagation(); e.preventDefault(); setSelected(room.id); setSelectedDevice(""); setDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
    gestureRef.current = {kind,roomId:room.id,start:pointer(e),snapshot:snapshot(),points:clone(room.points),devices:clone(project.devices),bounds:roomBounds(room.points),...extras};
  };
  const beginDeviceGesture = (e: PointerEvent<SVGGElement>, device: Device) => {
    e.stopPropagation(); e.preventDefault(); setSelected(device.roomId); setSelectedDevice(view === "editor" ? device.id : "");
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
    if(gesture.changed){
      setHistory(h=>[...h.slice(-39),gesture.snapshot]);setFuture([]);
      if (gesture.kind === "device" && gesture.deviceId) setProject(p=>inferLightOverlay(p,gesture.deviceId!) as Project);
    } gestureRef.current=null; setDragging(false);
  };
  const onCanvas = (e: PointerEvent<SVGSVGElement>) => {
    if (view !== "editor" || gestureRef.current) return;
    const p = pointer(e);
    if (tool === "select") { setSelected(""); setSelectedDevice(""); }
    if (tool === "draw") setDraft(d => [...d, p]);
    if (tool === "device" && current) {
      const id=`device-${crypto.randomUUID()}`;
      updateProject(old => ({...old, devices:[...old.devices,{id,roomId:current.id,x:p.x,y:p.y,type:"light",ha:createDefaultHaDeviceConfig("light") as HaDeviceConfig}]}));
      setSelectedDevice(id); setWelcomeVisible(true); setTool("select");
    }
  };
  const finishRoom = () => {
    if (draft.length < 3) return;
    const name = `Room ${project.rooms.length + 1}`; const id = slug(`${name}-${Date.now()}`);
    updateProject(old => ({...old,rooms:[...old.rooms,{id,name,points:draft,color:COLORS[old.rooms.length%COLORS.length],light:false,temperature:70}]}));
    setSelected(id); setSelectedDevice(""); setDraft([]); setTool("select");
  };
  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => { remember(); setProject(p=>({...p,width:img.naturalWidth,height:img.naturalHeight,image:String(reader.result),rooms:[],devices:[],homeAssistant:{...p.homeAssistant,overlays:[]}})); setSelected(""); setSelectedDevice(""); }; img.src=String(reader.result); };
    reader.readAsDataURL(file); e.target.value="";
  };
  const importProject = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = migrateProject(JSON.parse(String(reader.result)));
        if (typeof window !== "undefined") {
          const previous = localStorage.getItem(STORAGE_KEY);
          if (previous && !localStorage.getItem(V1_BACKUP_KEY)) localStorage.setItem(V1_BACKUP_KEY, previous);
        }
        setProject(result.project as Project); setHistory([]); setFuture([]); setSelected(""); setSelectedDevice(""); setAutosaveEnabled(true); setLoadNotice(result.migrated ? "Imported legacy project and upgraded it to schema v2." : "Project imported successfully.");
      } catch (error) { setLoadNotice(`Import failed: ${error instanceof Error ? error.message : "invalid project"}`); }
    };
    reader.readAsText(file); e.target.value="";
  };
  const undo = () => { const prev=history.at(-1); if(!prev)return; setFuture(f=>[snapshot(),...f]); setProject(p=>({...p,...clone(prev)})); setHistory(h=>h.slice(0,-1)); };
  const redo = () => { const next=future[0]; if(!next)return; setHistory(h=>[...h,snapshot()]); setProject(p=>({...p,...clone(next)})); setFuture(f=>f.slice(1)); };
  const download = (name:string, contents:string, type="application/json") => { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([contents],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href); };
  const exportSvg = () => download("floor-plan.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${project.width} ${project.height}" data-project-name="${project.name.replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]!))}"><title>${project.name}</title><g id="rooms">${project.rooms.map(r=>`<polygon id="${r.id}" data-room="${r.id}" points="${pointsAttr(r.points)}" fill="${r.color}" fill-opacity=".22" stroke="${r.color}"/>`).join("")}</g><g id="devices">${project.devices.map(d=>`<circle id="${d.id}" data-room="${d.roomId}" data-device-type="${d.type}" cx="${d.x}" cy="${d.y}" r="20"/>`).join("")}</g></svg>`, "image/svg+xml");
  const updateDeviceHa = (patch: Partial<HaDeviceConfig>) => {
    if (!currentDevice) return;
    updateProject(p=>{
      const oldDevice = p.devices.find(d=>d.id===currentDevice.id)!;
      const base = oldDevice.ha || createDefaultHaDeviceConfig(oldDevice.type) as HaDeviceConfig;
      const nextHa = {...base,...patch} as HaDeviceConfig;
      const overlays = oldDevice.ha?.entityId && oldDevice.ha.entityId !== nextHa.entityId ? p.homeAssistant.overlays.map(o=>o.entityId===oldDevice.ha?.entityId?{...o,entityId:nextHa.entityId}:o) : p.homeAssistant.overlays;
      const next={...p,devices:p.devices.map(d=>d.id===currentDevice.id?{...d,ha:nextHa}:d),homeAssistant:{...p.homeAssistant,overlays}};
      return inferLightOverlay(next,currentDevice.id) as Project;
    });
  };
  const updateAction = (key: "tapAction"|"holdAction"|"doubleTapAction", action: HaActionName) => {
    if (!currentDevice) return;
    updateDeviceHa({[key]:{action}} as Partial<HaDeviceConfig>);
  };
  const setOverlayRoom = (roomId: string) => { if (currentDevice) updateProject(p=>upsertDeviceOverlay(p,currentDevice.id,roomId) as Project); };
  const activateDevice = (device: Device) => {
    setSelected(device.roomId);
    if (view !== "playground" || device.type !== "light") return;
    updateProject(p=>toggleLightForDevice(p, device));
  };
  const deleteSelection = () => {
    if (view !== "editor" || tool !== "select") return;
    if (currentDevice) {
      if (!window.confirm(`Delete ${currentDevice.ha?.title || currentDevice.type} device?`)) return;
      updateProject(p=>({...p,devices:p.devices.filter(d=>d.id!==currentDevice.id),homeAssistant:{...p.homeAssistant,overlays:currentDevice.ha?.entityId?p.homeAssistant.overlays.filter(o=>o.entityId!==currentDevice.ha?.entityId):p.homeAssistant.overlays}}));
      setSelectedDevice(""); return;
    }
    if (current) {
      if (!window.confirm(`Delete ${current.name} and all devices in it?`)) return;
      updateProject(p=>({...p,rooms:p.rooms.filter(r=>r.id!==current.id),devices:p.devices.filter(d=>d.roomId!==current.id),homeAssistant:{...p.homeAssistant,overlays:p.homeAssistant.overlays.map(o=>({...o,roomIds:o.roomIds.filter(id=>id!==current.id)})).filter(o=>o.roomIds.length)}}));
      setSelected("");
    }
  };
  const closeActions = (returnFocus = false) => { setActionsOpen(false); if (returnFocus) window.setTimeout(()=>actionsButtonRef.current?.focus(),0); };
  const runAction = (fn: () => void) => { closeActions(); fn(); };
  const startEntitySetup = () => {
    closeActions(); setView("editor");
    if (entitySetupDevice) { setTool("select"); setSelected(entitySetupDevice.roomId); setSelectedDevice(entitySetupDevice.id); return; }
    const firstRoom = project.rooms[0];
    if (firstRoom) { setSelected(firstRoom.id); setSelectedDevice(""); setTool("device"); }
  };

  useEffect(() => {
    if (!autosaveEnabled) return;
    const errors = validateProjectV2(project);
    if (errors.length) return;
    const timer = window.setTimeout(() => { localStorage.setItem(STORAGE_KEY,JSON.stringify(project)); setSaved(true); }, 250);
    return () => window.clearTimeout(timer);
  }, [project, autosaveEnabled]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "Escape" && actionsOpen) { event.preventDefault(); closeActions(true); return; }
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
      if (view !== "editor" || tool !== "select" || (!current && !currentDevice)) return;
      event.preventDefault(); deleteSelection();
    };
    const onPointerDown = (event: MouseEvent) => { if (actionsOpen && !actionsRef.current?.contains(event.target as Node)) closeActions(); };
    window.addEventListener("keydown",onKeyDown); window.addEventListener("mousedown",onPointerDown);
    return () => { window.removeEventListener("keydown",onKeyDown); window.removeEventListener("mousedown",onPointerDown); };
  });

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brandmark">◇</span><span>Floor Plan <b>Studio</b></span><span className="beta">LOCAL</span></a>
      <div className="view-switch" role="tablist"><button className={view==="editor"?"active":""} onClick={()=>setView("editor")}>Editor</button><button className={view==="playground"?"active":""} onClick={()=>setView("playground")}>Playground</button></div>
      <div className="header-actions">
        <span className="privacy"><i/> Private on this device</span>
        <span className="autosave-status" role="status" aria-live="polite">{saved?"Auto-saved ✓":"Auto-save on"}</span>
        <input ref={projectFileRef} type="file" accept="application/json,.json" onChange={importProject} hidden/>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} hidden/>
        <div className="actions-menu" ref={actionsRef}>
          <button ref={actionsButtonRef} className="secondary actions-trigger" aria-haspopup="menu" aria-expanded={actionsOpen} onClick={()=>setActionsOpen(open=>!open)}>Actions <span aria-hidden="true">▾</span></button>
          {actionsOpen&&<div className="actions-popover" role="menu" aria-label="Project actions">
            <div className="menu-group-label">Import</div>
            <button role="menuitem" onClick={()=>runAction(()=>fileRef.current?.click())}>Upload floor-plan image</button>
            <button role="menuitem" onClick={()=>runAction(()=>projectFileRef.current?.click())}>Import project</button>
            <div className="menu-separator"/>
            <div className="menu-group-label">Export</div>
            <button role="menuitem" onClick={()=>runAction(()=>download("floor-plan.json",JSON.stringify(project,null,2)))}>Export project</button>
            <button role="menuitem" disabled={!project.rooms.length} title={!project.rooms.length?"Trace at least one room first":undefined} onClick={()=>runAction(exportSvg)}>Export SVG</button>
            <button role="menuitem" disabled={!hasHaExport} onClick={()=>runAction(()=>{window.location.href="/home-assistant-export"})}>Export for Home Assistant</button>
            {!hasHaExport&&<div className="export-prerequisite" role="note"><span>{entitySetupDevice?"Configure an Entity ID first.":"Add a device and configure its Entity ID first."}</span>{(entitySetupDevice||project.rooms.length>0)&&<button type="button" className="prerequisite-action" onClick={startEntitySetup}>{entitySetupDevice?"Select device":"Add a device"}</button>}</div>}
          </div>}
        </div>
      </div>
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
        <div className="stage-top"><div><span className="eyebrow">{view==="editor"?"SEMANTIC EDITOR":"INTERACTIVE PREVIEW"}</span>{view==="editor"?<input className="project-name" aria-label="Project name" value={project.name} onChange={e=>{setSaved(false);setProject(p=>({...p,name:e.target.value}))}} onBlur={()=>setProject(p=>({...p,name:p.name.trim()||"Untitled project"}))}/>:<h1>{project.name}</h1>}</div></div>
        {loadNotice&&<div className="hint edit-hint" role="status">{loadNotice}</div>}
        <div className={`canvas-wrap ${tool} ${dragging?"dragging":""}`}>
          {welcomeVisible&&currentDevice&&<aside className="ha-welcome" aria-labelledby="ha-welcome-title">
            <button className="welcome-close" aria-label="Dismiss Home Assistant welcome tip" onClick={()=>setWelcomeVisible(false)}>×</button>
            <span className="eyebrow">HOME ASSISTANT QUICK START</span>
            <h2 id="ha-welcome-title">Create your Home Assistant floor plan</h2>
            <ol><li>Place a device inside a room.</li><li>Enter its name and Entity ID.</li><li>Choose <b>Actions → Export for Home Assistant</b>.</li><li>Copy the generated YAML into Home Assistant.</li></ol>
            <p>Tap toggles the device, hold opens more information, and its room lights up when the entity is on.</p>
            <div className="welcome-actions"><button className="primary" onClick={()=>{setTool("select");setSelectedDevice(currentDevice.id);document.querySelector<HTMLInputElement>("#ha-entity-id")?.focus()}}>Configure this device</button><button className="secondary" onClick={()=>setWelcomeVisible(false)}>Got it</button><button className="welcome-never" onClick={()=>{localStorage.setItem(WELCOME_KEY,"true");setWelcomeVisible(false)}}>Don&apos;t show again</button></div>
          </aside>}
          <svg ref={svgRef} viewBox={`0 0 ${project.width} ${project.height}`} onPointerDown={onCanvas} onPointerMove={onPointerMove} onPointerUp={endGesture} onPointerCancel={endGesture} onDoubleClick={finishRoom} aria-label="Floor plan editor">
            <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#dce4e2" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="#f5f7f6"/>{!project.image&&<rect width="100%" height="100%" fill="url(#grid)"/>}
            {project.image&&<image href={project.image} width={project.width} height={project.height} preserveAspectRatio="xMidYMid meet"/>}
            {project.rooms.map(room=><g key={room.id} className={`room-shape ${selected===room.id&&!selectedDevice?"selected":""} ${room.light?"lit":""}`} onPointerDown={e=>view==="editor"&&tool==="select"?beginGesture(e,room,"move"):(e.stopPropagation(),setSelected(room.id),setSelectedDevice(""))}>
              <polygon points={pointsAttr(room.points)} style={{"--room":room.color} as React.CSSProperties}/>
              <text x={room.points.reduce((a,p)=>a+p.x,0)/room.points.length} y={room.points.reduce((a,p)=>a+p.y,0)/room.points.length}>{room.name}</text>
            </g>)}
            {view==="editor"&&tool==="select"&&current&&!currentDevice&&currentBounds&&<g className="shape-controls" aria-label={`Edit ${current.name}`}>
              <rect className="selection-box" x={currentBounds.minX} y={currentBounds.minY} width={currentBounds.width} height={currentBounds.height}/>
              {HANDLES.map(h=>{const p=handlePoint(currentBounds,h);return <rect key={h} className={`resize-handle handle-${h}`} x={p.x-7} y={p.y-7} width="14" height="14" rx="2" onPointerDown={e=>beginGesture(e,current,"resize",{handle:h})}/>})}
              {current.points.map((p,i)=><circle key={i} className="vertex-handle" cx={p.x} cy={p.y} r="8" onPointerDown={e=>beginGesture(e,current,"vertex",{vertexIndex:i})}/>) }
            </g>}
            {draft.length>0&&<><polyline className="draft-line" points={pointsAttr(draft)}/>{draft.map((p,i)=><circle className="draft-point" key={i} cx={p.x} cy={p.y} r="7"/> )}</>}
            {project.devices.map(d=>{const room=project.rooms.find(r=>r.id===d.roomId);const interactive=view==="playground"&&d.type==="light";const draggable=view==="editor"&&tool==="select";return <g key={d.id} className={`device-dot ${interactive?"interactive":""} ${draggable?"draggable":""} ${selectedDevice===d.id?"selected":""} ${room?.light?"on":"off"}`} transform={`translate(${d.x} ${d.y})`} role={interactive?"button":undefined} tabIndex={interactive?0:undefined} aria-label={interactive?`${room?.name||"Room"} light: ${room?.light?"on":"off"}`:undefined} aria-pressed={interactive?Boolean(room?.light):undefined} onPointerDown={e=>beginDeviceGesture(e,d)} onKeyDown={e=>{if(interactive&&(e.key==="Enter"||e.key===" ")){e.preventDefault();e.stopPropagation();activateDevice(d)}}}><circle className="device-hit-area" r="24"/><circle className="device-face" r="20"/>{d.type==="light"?<g className="device-icon device-icon-light" aria-hidden="true"><circle r="4"/><path d="M0-12v4M0 8v4M-12 0h4M8 0h4M-8.5-8.5l2.9 2.9M5.6 5.6l2.9 2.9M8.5-8.5L5.6-5.6M-5.6 5.6l-2.9 2.9"/></g>:<g className="device-icon device-icon-sensor" aria-hidden="true"><path d="M-3-10a3 3 0 0 1 6 0V3.2a7 7 0 1 1-6 0V-10Z"/><path d="M0-5V7"/><circle cy="8" r="2.5"/></g>}</g>})}
          </svg>
          {tool==="draw"&&<div className="hint">Click around a room · Double-click to finish · {draft.length} points</div>}
          {tool==="select"&&current&&view==="editor"&&!dragging&&<div className="hint edit-hint">Drag rooms or devices · Use handles to resize and adjust corners</div>}
          {!project.rooms.length&&tool!=="draw"&&<div className="empty-card"><span>⬡</span><h2>Trace your first room</h2><p>Choose the Room tool, click each corner, then double-click to close the shape.</p><button className="primary" onClick={()=>setTool("draw")}>Start tracing</button></div>}
        </div>
        <footer className="statusbar"><span>{stats.rooms} rooms</span><span>{stats.devices} devices</span><span className="grow"/><span>Original coordinates · {project.width} × {project.height}</span></footer>
      </section>

      <aside className="inspector">
        <div className="inspector-title"><div><span className="eyebrow">INSPECTOR</span><h2>{currentDevice ? `${currentDevice.type === "light" ? "Light" : "Sensor"} device` : current?.name || "Nothing selected"}</h2></div><span className="color-dot" style={{background:current?.color||"#ccd5d2"}}/></div>
        {currentDevice ? <>
          <p className="inspector-helper">Configure the Home Assistant entity represented by this device.</p>
          <div className="inspector-section primary-settings">
            <div className="section-heading">Device</div>
            <label>Alias / title<input placeholder="Alarm light" value={currentDevice.ha?.title||""} onChange={e=>updateDeviceHa({title:e.target.value})}/></label>
            <label>Entity ID<input id="ha-entity-id" className={entityError?"invalid":""} aria-invalid={Boolean(entityError)} aria-describedby={entityError?"entity-error":"entity-help"} placeholder={currentDevice.type==="light"?"light.alarm_light":"sensor.room_temperature"} value={currentDevice.ha?.entityId||""} onChange={e=>updateDeviceHa({entityId:e.target.value.trim()})}/><small id="entity-help">Example: <code>light.alarm_light</code></small>{entityError&&<small id="entity-error" className="field-error" role="alert">{entityError}</small>}</label>
            <div className="field"><span>Device type</span><b>{currentDevice.type}</b></div>
            <label>Display mode<select className="styled-select" value={currentDevice.ha?.mode || (currentDevice.type==="light"?"icon-and-label":"state-label")} onChange={e=>updateDeviceHa({mode:e.target.value as HaDeviceConfig["mode"]})}><option value="state-icon">State icon</option><option value="state-label">State label</option><option value="icon-and-label">Icon + label</option></select></label>
            <label>Tap action<select className="styled-select" value={currentDevice.ha?.tapAction.action || (currentDevice.type==="light"?"toggle":"more-info")} onChange={e=>updateAction("tapAction",e.target.value as HaActionName)}>{ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}</select></label>
          </div>

          <details className="inspector-disclosure">
            <summary>Appearance</summary>
            <div className="disclosure-body">
              {currentDevice.ha?.mode!=="state-label"&&<label>Icon override<input placeholder="mdi:alarm-light" value={currentDevice.ha?.icon||""} onChange={e=>updateDeviceHa({icon:e.target.value.trim()})}/></label>}
              <label><span className="label-row"><span>Icon size</span><span>{currentDevice.ha?.iconSizePx||40} px</span></span><input type="range" min="12" max="96" value={currentDevice.ha?.iconSizePx||40} onChange={e=>updateDeviceHa({iconSizePx:+e.target.value})}/></label>
            </div>
          </details>

          <details className="inspector-disclosure">
            <summary>Interactions</summary>
            <div className="disclosure-body">
              <label>Hold action<select className="styled-select" value={currentDevice.ha?.holdAction.action||"none"} onChange={e=>updateAction("holdAction",e.target.value as HaActionName)}>{ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}</select></label>
              <label>Double-tap action<select className="styled-select" value={currentDevice.ha?.doubleTapAction.action||"none"} onChange={e=>updateAction("doubleTapAction",e.target.value as HaActionName)}>{ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}</select></label>
            </div>
          </details>

          {currentDevice.type==="light"&&<details className="inspector-disclosure">
            <summary>Room behavior</summary>
            <div className="disclosure-body"><label>Lighting overlay<select className="styled-select" value={currentOverlay?.roomIds[0]||""} onChange={e=>setOverlayRoom(e.target.value)}><option value="">None</option>{project.rooms.map(room=><option key={room.id} value={room.id}>{room.name}{room.id===currentDevice.roomId?" (containing room)":""}</option>)}</select></label></div>
          </details>}

          <details className="inspector-disclosure">
            <summary>Advanced</summary>
            <div className="disclosure-body"><div className="field"><span>Internal device ID</span><code>{currentDevice.id}</code></div><div className="field"><span>Exact position</span><b>{currentDevice.x}, {currentDevice.y}</b></div><div className="privacy-notice">Entity IDs are saved as project metadata. Tokens and credentials are never requested or exported.</div></div>
          </details>

          {currentHaErrors.filter(error=>error!==entityError).length>0&&<div className="validation-summary" role="status"><b>Home Assistant validation</b>{currentHaErrors.filter(error=>error!==entityError).map(error=><p key={error}>{error}</p>)}</div>}
          <div className="danger-zone"><div><b>Danger zone</b><p>Deleting removes the device and its associated overlay mapping.</p></div><button className="danger-button" onClick={deleteSelection}>Delete device</button></div>
        </> : current ? <>
          <div className="edit-callout"><b>Edit shape</b><p>Drag the room to move it. Use square handles to resize or round handles to adjust individual vertices.</p></div>
          <label>Room name<input value={current.name} onChange={e=>setProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,name:e.target.value}:r)}))} onBlur={remember}/></label>
          <div className="field"><span>Room ID</span><code>{current.id}</code></div>
          <div className="field"><span>Vertices</span><b>{current.points.length}</b></div>
          <div className="section-title">PLAYGROUND STATE</div>
          <button className={`toggle-row ${current.light?"on":""}`} onClick={()=>updateProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,light:!r.light}:r)}))}><span><i>☼</i> Light</span><b>{current.light?"ON":"OFF"}</b></button>
          <label>Temperature <span className="range-value">{current.temperature}°F</span><input type="range" min="55" max="85" value={current.temperature} onChange={e=>setProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,temperature:+e.target.value}:r)}))}/></label>
          <div className="section-title">ROOM COLOR</div><div className="swatches">{COLORS.map(c=><button key={c} className={current.color===c?"active":""} style={{background:c}} onClick={()=>updateProject(p=>({...p,rooms:p.rooms.map(r=>r.id===current.id?{...r,color:c}:r)}))}/>)}</div>
          <button className="danger" onClick={deleteSelection}>Delete room and its devices</button>
        </>:<div className="inspector-empty">Select a room to edit its shape, label, status, color, and devices.</div>}
      </aside>
    </section>
  </main>;
}
