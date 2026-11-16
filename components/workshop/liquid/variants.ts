// PROTOTYPE, never merge. Liquid Pour workshop: the switchable variants (kept out of the
// component files so Fast Refresh only ever sees component modules).
import {
  TIER_KEYS,
  VARIANT_KEYS,
  type TierKey,
  type VariantKey,
} from "./engine/params";

export type WorkshopVariant = VariantKey | "off";

export const WORKSHOP_VARIANTS: readonly {
  key: WorkshopVariant;
  label: string;
}[] = [
  { key: "form", label: "cascade pours into shapes, section by section" },
  { key: "cascade", label: "full-width falling sheet" },
  { key: "cup", label: "filled cup, follows the screen" },
  { key: "stream", label: "one thick honey column" },
  { key: "drip", label: "gooey drips" },
  { key: "off", label: "current page (control)" },
];

export function parseVariant(value: string | null): WorkshopVariant {
  if (value === "off") return "off";
  return (VARIANT_KEYS as readonly string[]).includes(value ?? "")
    ? (value as VariantKey)
    : "form";
}

export function parseTier(value: string | null): TierKey | null {
  return (TIER_KEYS as readonly string[]).includes(value ?? "")
    ? (value as TierKey)
    : null;
}
