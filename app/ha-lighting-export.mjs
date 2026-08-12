import { buildOverlayDataUriMap } from "./ha-overlay.mjs";
import { buildPictureElementsCard, generateHomeAssistantYaml } from "./ha-export.mjs";

export function buildHomeAssistantCardWithOverlays(project) {
  const lightingSvgDataUriByOverlayId = buildOverlayDataUriMap(project);
  return buildPictureElementsCard(project, { lightingSvgDataUriByOverlayId });
}

export function generateHomeAssistantYamlWithOverlays(project) {
  const lightingSvgDataUriByOverlayId = buildOverlayDataUriMap(project);
  return generateHomeAssistantYaml(project, { lightingSvgDataUriByOverlayId });
}
