import { useContext } from "react";
import { SettingsContext } from "@/context/SettingsContext";
import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 * Respects the user's explicit theme preference from SettingsContext.
 * Falls back to the light palette when SettingsContext is unavailable.
 */
export function useColors() {
  const settings = useContext(SettingsContext);
  const theme = settings?.theme ?? "light";
  const palette = theme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
