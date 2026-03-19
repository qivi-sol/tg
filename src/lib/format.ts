export const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0
  }).format(value);

export const formatTimer = (targetIso: string | null, nowMs = Date.now()) => {
  if (!targetIso) {
    return "Ready now";
  }

  const remaining = new Date(targetIso).getTime() - nowMs;

  if (remaining <= 0) {
    return "Ready now";
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
};

export const initialsFromName = (name?: string | null) => {
  if (!name) {
    return "TV";
  }

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export const clampLabel = (value?: string | null) => {
  if (!value) {
    return "Vault Raider";
  }

  return value.length > 16 ? `${value.slice(0, 15)}…` : value;
};

export const formatRelativeDateTime = (iso: string | null) => {
  if (!iso) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
};
