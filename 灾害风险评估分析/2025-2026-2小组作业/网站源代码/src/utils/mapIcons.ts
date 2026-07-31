import L from "leaflet";
import type { VillagePointFeature } from "../types/villagePoint";

const hazardMarkerSvgMarkup = `
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M9.85786 32.7574C6.23858 33.8432 4 35.3432 4 37C4 40.3137 12.9543 43 24 43C35.0457 43 44 40.3137 44 37C44 35.3432 41.7614 33.8432 38.1421 32.7574" stroke="#333" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 35C24 35 37 26.504 37 16.6818C37 9.67784 31.1797 4 24 4C16.8203 4 11 9.67784 11 16.6818C11 26.504 24 35 24 35Z" fill="#d0021b" stroke="#333" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 22C26.7614 22 29 19.7614 29 17C29 14.2386 26.7614 12 24 12C21.2386 12 19 14.2386 19 17C19 19.7614 21.2386 22 24 22Z" fill="#0a0a0a" stroke="#070606" stroke-width="3" stroke-linejoin="round"/>
  </svg>
`;

const villagePointMarkerSvgMarkup = `
  <svg width="35" height="35" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M24 8L44 21V44H4L4 21L24 8Z" fill="#4a90e2" stroke="#333" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 44V23L12 28L12 44" stroke="#070606" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M28 44V23L36 28L36 44" stroke="#070606" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M41 44H8" stroke="#333" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

export function createHazardMarkerIcon(
  isSelected: boolean,
  matchesHazardType: boolean,
) {
  const size = 35;
  const opacity = isSelected ? 1 : matchesHazardType ? 0.96 : 0.45;

  return L.divIcon({
    className: "hazardSvgIcon",
    html: `<div style="width:${size}px;height:${size}px;opacity:${opacity};">${hazardMarkerSvgMarkup}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 8],
  });
}

export function createVillagePointMarkerIcon(
  feature: VillagePointFeature,
  isSelected: boolean,
  selectedRiskLevels: number[],
) {
  const matchesRiskFilter =
    selectedRiskLevels.length === 0 ||
    selectedRiskLevels.includes(feature.properties.Risk_Cls4);
  const size = 35;
  const opacity = isSelected ? 1 : !matchesRiskFilter ? 0.45 : 0.92;
  const selectedClassName = isSelected ? " isSelected" : "";

  return L.divIcon({
    className: `villagePointSvgIcon${selectedClassName}`,
    html: `<div class="villagePointMarkerInner${selectedClassName}" style="width:${size}px;height:${size}px;opacity:${opacity};">${villagePointMarkerSvgMarkup}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 8],
  });
}
