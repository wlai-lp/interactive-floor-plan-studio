export const PROJECT_SCHEMA_VERSION = 2;

export const HA_ACTIONS = ["none", "more-info", "toggle"];
export const HA_ELEMENT_MODES = ["state-icon", "state-label", "icon-and-label"];

const ENTITY_ID = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const HEX_COLOR = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

export function createDefaultHaDeviceConfig(type = "light") {
  return {
    entityId: "",
    title: "",
    mode: type === "light" ? "icon-and-label" : "state-label",
    label: {
      enabled: true,
      offsetY: 44,
      fontSizePx: 14,
      color: "#ffffff",
    },
    icon: "",
    iconSizePx: 40,
    tapAction: { action: type === "light" ? "toggle" : "more-info" },
    holdAction: { action: type === "light" ? "more-info" : "none" },
    doubleTapAction: { action: "none" },
  };
}

export function createDefaultHomeAssistantSettings() {
  return {
    background: "rooms-and-uploaded-image",
    overlays: [],
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finite(value, path, errors) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path} must be a finite number`);
    return false;
  }
  return true;
}

function normalizeAction(value, fallback = "none") {
  const action = isRecord(value) ? value.action : value;
  return { action: HA_ACTIONS.includes(action) ? action : fallback };
}

function normalizeHaDeviceConfig(value, type) {
  if (!isRecord(value)) return undefined;
  const defaults = createDefaultHaDeviceConfig(type);
  const labelValue = isRecord(value.label) ? value.label : {};
  return {
    entityId: typeof value.entityId === "string" ? value.entityId.trim() : "",
    title: typeof value.title === "string" ? value.title : "",
    mode: HA_ELEMENT_MODES.includes(value.mode) ? value.mode : defaults.mode,
    label: {
      enabled: typeof labelValue.enabled === "boolean" ? labelValue.enabled : defaults.label.enabled,
      offsetY: typeof labelValue.offsetY === "number" ? labelValue.offsetY : defaults.label.offsetY,
      fontSizePx: typeof labelValue.fontSizePx === "number" ? labelValue.fontSizePx : defaults.label.fontSizePx,
      color: typeof labelValue.color === "string" ? labelValue.color : defaults.label.color,
    },
    icon: typeof value.icon === "string" ? value.icon.trim() : "",
    iconSizePx: typeof value.iconSizePx === "number" ? value.iconSizePx : defaults.iconSizePx,
    tapAction: normalizeAction(value.tapAction, defaults.tapAction.action),
    holdAction: normalizeAction(value.holdAction, defaults.holdAction.action),
    doubleTapAction: normalizeAction(value.doubleTapAction),
  };
}

function normalizeOverlay(value) {
  if (!isRecord(value)) return null;
  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : `overlay-${Date.now()}`,
    entityId: typeof value.entityId === "string" ? value.entityId.trim() : "",
    state: "on",
    roomIds: Array.isArray(value.roomIds) ? [...new Set(value.roomIds.filter(id => typeof id === "string"))] : [],
    fill: typeof value.fill === "string" ? value.fill : "#ffd166",
    opacity: typeof value.opacity === "number" ? value.opacity : 0.35,
    blurPx: typeof value.blurPx === "number" ? value.blurPx : 8,
    mappingSource: value.mappingSource === "inferred" ? "inferred" : "explicit",
  };
}

export function pointInRoom(point, room) {
  const points = Array.isArray(room?.points) ? room.points : [];
  if (points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    const crosses = ((a.y > point.y) !== (b.y > point.y)) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function containingRoomIds(project, device) {
  return (project.rooms || []).filter(room => pointInRoom(device, room)).map(room => room.id);
}

export function inferLightOverlay(project, deviceId) {
  const device = project.devices.find(item => item.id === deviceId);
  if (!device || device.type !== "light") return project;
  const matches = containingRoomIds(project, device);
  const existing = device.ha?.entityId
    ? project.homeAssistant.overlays.find(overlay => overlay.entityId === device.ha.entityId)
    : undefined;
  if (existing?.mappingSource === "explicit") return project;

  const otherOverlays = project.homeAssistant.overlays.filter(overlay => overlay.entityId !== device.ha?.entityId);
  if (matches.length !== 1 || !device.ha?.entityId) {
    return { ...project, homeAssistant: { ...project.homeAssistant, overlays: otherOverlays } };
  }

  const roomId = matches[0];
  const overlay = {
    id: existing?.id || `overlay-${device.id}`,
    entityId: device.ha.entityId,
    state: "on",
    roomIds: [roomId],
    fill: existing?.fill || "#ffd166",
    opacity: existing?.opacity ?? 0.35,
    blurPx: existing?.blurPx ?? 8,
    mappingSource: "inferred",
  };
  return {
    ...project,
    devices: project.devices.map(item => item.id === device.id ? { ...item, roomId } : item),
    homeAssistant: { ...project.homeAssistant, overlays: [...otherOverlays, overlay] },
  };
}

export function validateHaDeviceConfig(config, path = "device.ha") {
  if (!config) return [];
  const errors = [];
  if (!config.entityId || !ENTITY_ID.test(config.entityId)) errors.push(`${path}.entityId must look like light.kitchen`);
  if (!HA_ELEMENT_MODES.includes(config.mode)) errors.push(`${path}.mode is unsupported`);
  if (config.icon && !/^mdi:[a-z0-9-]+$/.test(config.icon)) errors.push(`${path}.icon must be an mdi:* icon`);
  if (!Number.isFinite(config.iconSizePx) || config.iconSizePx < 12 || config.iconSizePx > 96) errors.push(`${path}.iconSizePx must be between 12 and 96`);
  for (const key of ["tapAction", "holdAction", "doubleTapAction"]) {
    if (!config[key] || !HA_ACTIONS.includes(config[key].action)) errors.push(`${path}.${key}.action is unsupported`);
  }
  if (config.label) {
    if (!Number.isFinite(config.label.offsetY)) errors.push(`${path}.label.offsetY must be finite`);
    if (!Number.isFinite(config.label.fontSizePx) || config.label.fontSizePx < 8 || config.label.fontSizePx > 48) errors.push(`${path}.label.fontSizePx must be between 8 and 48`);
    if (!HEX_COLOR.test(config.label.color)) errors.push(`${path}.label.color must be a hex color`);
  }
  return errors;
}

export function validateProjectV2(project) {
  const errors = [];
  if (!isRecord(project)) return ["project must be an object"];
  if (project.schemaVersion !== PROJECT_SCHEMA_VERSION) errors.push(`schemaVersion must be ${PROJECT_SCHEMA_VERSION}`);
  if (typeof project.name !== "string" || !project.name.trim()) errors.push("name is required");
  if (finite(project.width, "width", errors) && (project.width < 1 || project.width > 20000)) errors.push("width must be between 1 and 20000");
  if (finite(project.height, "height", errors) && (project.height < 1 || project.height > 20000)) errors.push("height must be between 1 and 20000");
  if (typeof project.image !== "string") errors.push("image must be a string");
  if (!Array.isArray(project.rooms)) errors.push("rooms must be an array");
  if (!Array.isArray(project.devices)) errors.push("devices must be an array");

  const roomIds = new Set();
  for (const [index, room] of (Array.isArray(project.rooms) ? project.rooms : []).entries()) {
    const path = `rooms[${index}]`;
    if (!isRecord(room) || typeof room.id !== "string" || !room.id) { errors.push(`${path}.id is required`); continue; }
    roomIds.add(room.id);
    if (!Array.isArray(room.points) || room.points.length < 3) errors.push(`${path}.points must contain at least 3 points`);
    for (const [pointIndex, point] of (Array.isArray(room.points) ? room.points : []).entries()) {
      if (!isRecord(point)) { errors.push(`${path}.points[${pointIndex}] must be an object`); continue; }
      finite(point.x, `${path}.points[${pointIndex}].x`, errors);
      finite(point.y, `${path}.points[${pointIndex}].y`, errors);
    }
  }

  for (const [index, device] of (Array.isArray(project.devices) ? project.devices : []).entries()) {
    const path = `devices[${index}]`;
    if (!isRecord(device) || typeof device.id !== "string" || !device.id) { errors.push(`${path}.id is required`); continue; }
    if (!roomIds.has(device.roomId)) errors.push(`${path}.roomId references a missing room`);
    finite(device.x, `${path}.x`, errors);
    finite(device.y, `${path}.y`, errors);
    if (device.type !== "light" && device.type !== "sensor" && device.type !== "plug") errors.push(`${path}.type is unsupported`);
    errors.push(...validateHaDeviceConfig(device.ha, `${path}.ha`));
  }

  if (!isRecord(project.homeAssistant) || project.homeAssistant.background !== "rooms-and-uploaded-image" || !Array.isArray(project.homeAssistant.overlays)) {
    errors.push("homeAssistant settings are invalid");
  } else {
    for (const [index, overlay] of project.homeAssistant.overlays.entries()) {
      const path = `homeAssistant.overlays[${index}]`;
      if (!isRecord(overlay)) { errors.push(`${path} must be an object`); continue; }
      if (!ENTITY_ID.test(overlay.entityId || "")) errors.push(`${path}.entityId must look like light.kitchen`);
      if (overlay.state !== "on") errors.push(`${path}.state must be on`);
      if (!Array.isArray(overlay.roomIds) || !overlay.roomIds.length) errors.push(`${path}.roomIds must include at least one room`);
      else for (const roomId of overlay.roomIds) if (!roomIds.has(roomId)) errors.push(`${path}.roomIds references missing room ${roomId}`);
      if (!HEX_COLOR.test(overlay.fill || "")) errors.push(`${path}.fill must be a hex color`);
      if (!Number.isFinite(overlay.opacity) || overlay.opacity < 0 || overlay.opacity > 1) errors.push(`${path}.opacity must be between 0 and 1`);
      if (!Number.isFinite(overlay.blurPx) || overlay.blurPx < 0 || overlay.blurPx > 24) errors.push(`${path}.blurPx must be between 0 and 24`);
    }
  }
  return errors;
}

export function migrateProject(raw) {
  if (!isRecord(raw)) throw new Error("Project must be a JSON object");
  const migrated = raw.schemaVersion !== PROJECT_SCHEMA_VERSION;
  const rooms = Array.isArray(raw.rooms) ? raw.rooms.map(room => ({ ...room, points: Array.isArray(room?.points) ? room.points.map(point => ({ ...point })) : room?.points })) : raw.rooms;
  const devices = Array.isArray(raw.devices) ? raw.devices.map(device => ({ ...device, ha: normalizeHaDeviceConfig(device?.ha, device?.type) })) : raw.devices;
  const rawHa = isRecord(raw.homeAssistant) ? raw.homeAssistant : createDefaultHomeAssistantSettings();
  const project = {
    ...raw,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Sample project",
    rooms,
    devices,
    homeAssistant: {
      background: "rooms-and-uploaded-image",
      overlays: Array.isArray(rawHa.overlays) ? rawHa.overlays.map(normalizeOverlay).filter(Boolean) : [],
    },
  };
  const errors = validateProjectV2(project);
  if (errors.length) throw new Error(errors.join("\n"));
  return { project, migrated };
}

export function upsertDeviceOverlay(project, deviceId, roomId) {
  const device = project.devices.find(item => item.id === deviceId);
  if (!device?.ha?.entityId || device.type !== "light") return project;
  const entityId = device.ha.entityId;
  const overlays = project.homeAssistant.overlays.filter(overlay => overlay.entityId !== entityId);
  if (roomId) {
    overlays.push({
      id: `overlay-${device.id}`,
      entityId,
      state: "on",
      roomIds: [roomId],
      fill: "#ffd166",
      opacity: 0.35,
      blurPx: 8,
      mappingSource: "explicit",
    });
  }
  return { ...project, homeAssistant: { ...project.homeAssistant, overlays } };
}
