export interface AccentDef {
  id: string;
  label: string;
  value: string;
  ink: string;
  second: string;
}

export const ACCENTS: AccentDef[] = [
  { id: "blue", label: "Blueprint", value: "#2f6bff", ink: "#1c50d6", second: "#5e3ee0" },
  { id: "violet", label: "Violet", value: "#6b46e5", ink: "#5232c9", second: "#2f6bff" },
  { id: "emerald", label: "Emerald", value: "#0f9d6a", ink: "#0a7a52", second: "#0e7490" },
  { id: "amber", label: "Amber", value: "#c2751a", ink: "#9a5a10", second: "#d64545" },
  { id: "ink", label: "Ink", value: "#3a3a3f", ink: "#1a1a1e", second: "#6b6b74" },
];

export const DEFAULT_ACCENT = ACCENTS[0]!;
