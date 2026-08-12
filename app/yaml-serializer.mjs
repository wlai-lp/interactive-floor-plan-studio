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
