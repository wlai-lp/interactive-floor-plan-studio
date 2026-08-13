import { buildOverlayDataUriMap } from "./ha-overlay.mjs";
import { buildPictureElementsCard, generateHomeAssistantYaml } from "./ha-export.mjs";
import { validateProjectV2 } from "./project-schema.mjs";

const ENTITY_ID = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const WARN_YAML_BYTES = 500 * 1024;
const HARD_YAML_BYTES = 2 * 1024 * 1024;

const byteLength = (value) => new TextEncoder().encode(value).byteLength;

export function safeYamlFilename(name) {
  const slug = String(name || "floor-plan").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "floor-plan";
  return `${slug}-home-assistant.yaml`;
}

export function validateHomeAssistantExport(project) {
  const errors = [...validateProjectV2(project)];
  const warnings = [];
  const roomIds = new Set((project.rooms || []).map((room) => room.id));

  for (const device of project.devices || []) {
    if (!device.ha) continue;
    const path = `Device ${device.id}`;
    if (!device.ha.entityId) errors.push(`${path}: Home Assistant entity ID is required for export.`);
    else if (!ENTITY_ID.test(device.ha.entityId)) errors.push(`${path}: entity ID must look like light.kitchen.`);
    if (device.type === "light") {
      if (device.ha.tapAction?.action !== "toggle") errors.push(`${path}: light tap action must be toggle for the MVP export.`);
      if (device.ha.holdAction?.action !== "more-info") errors.push(`${path}: light hold action must be more-info for the MVP export.`);
      if (device.ha.mode !== "state-label" && device.ha.mode !== "icon-and-label") errors.push(`${path}: a state label is required for the canonical MVP export.`);
      const overlay = (project.homeAssistant?.overlays || []).find((item) => item.entityId === device.ha.entityId);
      if (!overlay) errors.push(`${path}: light must be mapped to a room overlay.`);
      else if (!overlay.roomIds?.length || overlay.roomIds.some((roomId) => !roomIds.has(roomId))) errors.push(`${path}: overlay must reference complete existing room geometry.`);
    }
  }

  return { errors: [...new Set(errors)], warnings };
}

export function createHomeAssistantExport(project) {
  const validation = validateHomeAssistantExport(project);
  if (validation.errors.length) return { ...validation, yaml: "", card: null, bytes: 0, filename: safeYamlFilename(project?.name) };
  try {
    const overlayMap = buildOverlayDataUriMap(project);
    const card = buildPictureElementsCard(project, { lightingSvgDataUriByOverlayId: overlayMap });
    const yaml = generateHomeAssistantYaml(project, { lightingSvgDataUriByOverlayId: overlayMap });
    const bytes = byteLength(yaml);
    const warnings = [...validation.warnings];
    if (bytes > WARN_YAML_BYTES) warnings.push(`Generated YAML is approximately ${(bytes / 1024).toFixed(0)} KiB. Inline Base64 may be cumbersome in Home Assistant.`);
    const errors = bytes > HARD_YAML_BYTES ? [`Generated YAML exceeds the 2 MiB inline export limit.`] : [];
    const interactiveIndex = card.elements.findIndex((item) => item.type === "state-icon" || item.type === "state-label");
    const badOverlayIndex = card.elements.findIndex((item, index) => item.type === "conditional" && interactiveIndex >= 0 && index > interactiveIndex);
    if (badOverlayIndex >= 0) errors.push("Room overlays must be emitted before interactive controls.");
    for (const item of card.elements.filter((entry) => entry.type === "conditional")) {
      const image = item.elements?.[0];
      if (image?.style?.["pointer-events"] !== "none") errors.push("Room overlay must use pointer-events: none.");
    }
    return { errors, warnings, yaml: errors.length ? "" : yaml, card, bytes, filename: safeYamlFilename(project.name) };
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : "Home Assistant export failed."], warnings: validation.warnings, yaml: "", card: null, bytes: 0, filename: safeYamlFilename(project?.name) };
  }
}
