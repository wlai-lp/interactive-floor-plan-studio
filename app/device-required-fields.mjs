export const REQUIRED_HA_DEVICE_FIELDS = [
  {
    key: "title",
    label: "Alias / title",
    isMissing: (config) => !config?.title?.trim(),
  },
  {
    key: "entityId",
    label: "Entity ID",
    isMissing: (config) => !config?.entityId?.trim(),
  },
];

export function getMissingRequiredHaDeviceFields(config) {
  return REQUIRED_HA_DEVICE_FIELDS.filter((field) => field.isMissing(config));
}

export function isRequiredHaDeviceFieldMissing(config, key) {
  return getMissingRequiredHaDeviceFields(config).some((field) => field.key === key);
}
