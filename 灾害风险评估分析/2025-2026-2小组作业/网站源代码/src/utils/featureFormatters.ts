export function normalizeHazardId(value: string | number | null | undefined) {
  return value === null || value === undefined ? null : String(value);
}

export function getFeatureId(value: string | number | null | undefined) {
  return value === null || value === undefined ? null : String(value);
}

export function normalizeVillageName(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export function normalizeHazardType(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export function formatVillageName(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "未标注村庄";
}
