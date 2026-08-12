import { stringifyYaml } from "./yaml-serializer.mjs";

const ACTION_KEYS = ["tap_action", "hold_action", "double_tap_action"];
const SAFE_RASTER_DATA_URI = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
const safeId = (value) => String(value).replace(/[^A-Za-z0-9_.:-]/g, "-");
const round = (value) => Number(Number(value).toFixed(4));

export function sanitizeSvgText(value) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function serializeFloorPlanSvg(project) {
  const width = Number(project.width);
  const height = Number(project.height);
  if (!(width > 0) || !(height > 0)) throw new Error("Project viewBox dimensions must be positive");

  let raster = "";
  if (project.image) {
    if (!SAFE_RASTER_DATA_URI.test(project.image)) throw new Error("Background image must be an inline PNG, JPEG, or WebP Base64 data URI");
    raster = `<image href="${escapeXml(project.image)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  const rooms = (project.rooms || []).map((room) => {
    const points = (room.points || []).map((p) => `${Number(p.x)},${Number(p.y)}`).join(" ");
    return `<polygon id="${safeId(room.id)}" data-room="${escapeXml(room.id)}" points="${points}" fill="${escapeXml(room.color)}" fill-opacity="0.22" stroke="${escapeXml(room.color)}"/>`;
  }).join("");
  const title = escapeXml(sanitizeSvgText(project.name || "Floor plan"));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet"><title>${title}</title>${raster}<g id="rooms">${rooms}</g></svg>`;
}

export function svgDataUri(svg) {
  const bytes = new TextEncoder().encode(sanitizeSvgText(svg));
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    for (const byte of chunk) binary += String.fromCharCode(byte);
  }
  const encoded = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

export function anchorToPercent(device, project) {
  if (!(project.width > 0) || !(project.height > 0)) throw new Error("Project viewBox dimensions must be positive");
  return { left: round((Number(device.x) / Number(project.width)) * 100), top: round((Number(device.y) / Number(project.height)) * 100) };
}

const actionObject = (config) => config?.action && config.action !== "none" ? { action: config.action } : undefined;

export function buildPictureElementsCard(project, { lightingSvgDataUriByOverlayId = {} } = {}) {
  const elements = [];
  for (const overlay of project.homeAssistant?.overlays || []) {
    const image = lightingSvgDataUriByOverlayId[overlay.id];
    if (!image) continue;
    elements.push({
      type: "conditional",
      conditions: [{ entity: overlay.entityId, state: overlay.state || "on" }],
      elements: [{
        type: "image",
        image,
        style: {
          left: "50%",
          top: "50%",
          width: "100%",
          transform: "translate(-50%, -50%)",
          "pointer-events": "none",
        },
      }],
    });
  }
  for (const device of project.devices || []) {
    const ha = device.ha;
    if (!ha?.entityId) continue;
    const pos = anchorToPercent(device, project);
    const style = { left: `${pos.left}%`, top: `${pos.top}%`, transform: "translate(-50%, -50%)" };
    const actions = {};
    const values = [ha.tapAction, ha.holdAction, ha.doubleTapAction];
    ACTION_KEYS.forEach((key, index) => { const value = actionObject(values[index]); if (value) actions[key] = value; });
    if (ha.mode !== "state-label") elements.push({ type: "state-icon", entity: ha.entityId, title: ha.title || undefined, icon: ha.icon || undefined, style: { ...style, "--mdc-icon-size": ha.iconSizePx ? `${ha.iconSizePx}px` : undefined }, ...actions });
    if (ha.mode === "state-label" || ha.mode === "icon-and-label" || ha.label?.enabled) elements.push({ type: "state-label", entity: ha.entityId, style: { ...style, top: `${round(pos.top + ((ha.label?.offsetY || 0) / project.height) * 100)}%`, color: ha.label?.color || undefined, "font-size": ha.label?.fontSizePx ? `${ha.label.fontSizePx}px` : undefined } });
  }
  return { type: "picture-elements", image: svgDataUri(serializeFloorPlanSvg(project)), elements };
}

export function generateHomeAssistantYaml(project, options) {
  return `${stringifyYaml(buildPictureElementsCard(project, options))}\n`;
}
