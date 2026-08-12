import { svgDataUri } from "./ha-export.mjs";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));

export function buildOverlaySvg(project, overlay) {
  const width = Number(project.width);
  const height = Number(project.height);
  if (!(width > 0) || !(height > 0)) throw new Error("Project viewBox dimensions must be positive");
  if (!overlay?.entityId) throw new Error("Overlay entityId is required");
  if (!Array.isArray(overlay.roomIds) || !overlay.roomIds.length) throw new Error("Overlay must reference at least one room");
  if (!HEX_COLOR.test(overlay.fill || "")) throw new Error("Overlay fill must be a six-digit hex color");
  if (!Number.isFinite(overlay.opacity) || overlay.opacity < 0 || overlay.opacity > 1) throw new Error("Overlay opacity must be between 0 and 1");
  if (!Number.isFinite(overlay.blurPx) || overlay.blurPx < 0 || overlay.blurPx > 24) throw new Error("Overlay blurPx must be between 0 and 24");

  const roomMap = new Map((project.rooms || []).map((room) => [room.id, room]));
  const roomIds = [...new Set(overlay.roomIds)];
  const polygons = roomIds.map((roomId) => {
    const room = roomMap.get(roomId);
    if (!room) throw new Error(`Overlay references missing room ${roomId}`);
    if (!Array.isArray(room.points) || room.points.length < 3) throw new Error(`Room ${roomId} has invalid geometry`);
    const points = room.points.map((point) => `${Number(point.x)},${Number(point.y)}`).join(" ");
    return `<polygon data-room="${escapeXml(room.id)}" points="${points}" fill="${escapeXml(overlay.fill)}" fill-opacity="${Number(overlay.opacity)}"/>`;
  }).join("");

  const filterId = `overlay-blur-${String(overlay.id || "light").replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const defs = overlay.blurPx > 0 ? `<defs><filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${Number(overlay.blurPx)}"/></filter></defs>` : "";
  const groupOpen = overlay.blurPx > 0 ? `<g filter="url(#${filterId})">` : "<g>";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${defs}${groupOpen}${polygons}</g></svg>`;
}

export function buildOverlayDataUri(project, overlay) {
  return svgDataUri(buildOverlaySvg(project, overlay));
}

export function buildOverlayDataUriMap(project) {
  return Object.fromEntries((project.homeAssistant?.overlays || []).map((overlay) => [overlay.id, buildOverlayDataUri(project, overlay)]));
}
