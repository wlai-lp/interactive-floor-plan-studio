const ACTION_KEYS = ["tap_action", "hold_action", "double_tap_action"];

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
const safeId = (value) => String(value).replace(/[^A-Za-z0-9_.:-]/g, "-");
const round = (value) => Number(Number(value).toFixed(4));

export function sanitizeSvgText(value) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function serializeFloorPlanSvg(project) {
  const rooms = (project.rooms || []).map((room) => {
    const points = (room.points || []).map((p) => `${Number(p.x)},${Number(p.y)}`).join(" ");
    return `<polygon id="${safeId(room.id)}" data-room="${escapeXml(room.id)}" points="${points}" fill="${escapeXml(room.color)}" fill-opacity="0.22" stroke="${escapeXml(room.color)}"/>`;
  }).join("");
  const title = escapeXml(sanitizeSvgText(project.name || "Floor plan"));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Number(project.width)} ${Number(project.height)}"><title>${title}</title><g id="rooms">${rooms}</g></svg>`;
}

export function svgDataUri(svg) {
  const bytes = new TextEncoder().encode(sanitizeSvgText(svg));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
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
      elements: [{ type: "image", image, style: { left: "50%", top: "50%", width: "100%", opacity: overlay.opacity ?? 1, filter: overlay.blurPx ? `blur(${overlay.blurPx}px)` : undefined } }],
    });
  }
  for (const device of project.devices || []) {
    const ha = device.ha;
    if (!ha?.entityId) continue;
    const pos = anchorToPercent(device, project);
    const style = { left: `${pos.left}%`, top: `${pos.top}%` };
    const actions = {};
    const values = [ha.tapAction, ha.holdAction, ha.doubleTapAction];
    ACTION_KEYS.forEach((key, index) => { const value = actionObject(values[index]); if (value) actions[key] = value; });
    if (ha.mode !== "state-label") elements.push({ type: "state-icon", entity: ha.entityId, title: ha.title || undefined, icon: ha.icon || undefined, style: { ...style, "--mdc-icon-size": ha.iconSizePx ? `${ha.iconSizePx}px` : undefined }, ...actions });
    if (ha.mode === "state-label" || ha.mode === "icon-and-label" || ha.label?.enabled) elements.push({ type: "state-label", entity: ha.entityId, style: { ...style, top: `${round(pos.top + ((ha.label?.offsetY || 0) / project.height) * 100)}%`, color: ha.label?.color || undefined, "font-size": ha.label?.fontSizePx ? `${ha.label.fontSizePx}px` : undefined } });
  }
  return { type: "picture-elements", image: svgDataUri(serializeFloorPlanSvg(project)), elements };
}

const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, clean(v)]));
  return value;
};

const scalar = (value) => {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  const text = String(value);
  if (/^[A-Za-z0-9_.%/-]+$/.test(text) && !/^(true|false|null|yes|no|on|off)$/i.test(text)) return text;
  return JSON.stringify(text);
};

export function stringifyYaml(value, indent = 0) {
  value = clean(value);
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) return value.map((item) => {
    if (item && typeof item === "object") {
      const lines = stringifyYaml(item, indent + 2).split("\n");
      return `${pad}- ${lines[0].trimStart()}${lines.length > 1 ? `\n${lines.slice(1).join("\n")}` : ""}`;
    }
    return `${pad}- ${scalar(item)}`;
  }).join("\n");
  if (value && typeof value === "object") return Object.entries(value).map(([key, item]) => {
    if (item && typeof item === "object") return `${pad}${key}:\n${stringifyYaml(item, indent + 2)}`;
    return `${pad}${key}: ${scalar(item)}`;
  }).join("\n");
  return `${pad}${scalar(value)}`;
}

export function generateHomeAssistantYaml(project, options) {
  return `${stringifyYaml(buildPictureElementsCard(project, options))}\n`;
}
