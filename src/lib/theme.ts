import type { ThemeId } from "@/lib/coupleSettings";

export const THEMES: { id: ThemeId; label: string; swatch: [string, string]; emoji: string }[] = [
  { id: "light", label: "Light", swatch: ["#F6C945", "#E8A13D"], emoji: "☀️" },
  { id: "dark", label: "Dark", swatch: ["#3a3428", "#1c1912"], emoji: "🌙" },
  { id: "pink", label: "Pink", swatch: ["#F2A3BD", "#E8607A"], emoji: "🌸" },
  { id: "blue", label: "Blue", swatch: ["#7FC4E0", "#4A90C2"], emoji: "🌊" },
  { id: "forest", label: "Forest", swatch: ["#8FBF7A", "#4C7A3D"], emoji: "🌲" },
  { id: "galaxy", label: "Galaxy", swatch: ["#8B6FD6", "#2A1F52"], emoji: "🌌" },
  { id: "minimal", label: "Minimal", swatch: ["#D9D4C8", "#8A8478"], emoji: "◻️" },
];
