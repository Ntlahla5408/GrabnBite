/**
 * Shared mobile-first design tokens for every GrabnBite screen.
 * Keep layout, typography and component dimensions consistent across roles.
 */
import { Platform } from "react-native";

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 24,
} as const;

export const Typography = {
  display: 30,
  title: 26,
  heading: 22,
  subheading: 18,
  body: 14,
  bodyLarge: 15,
  label: 13,
  caption: 12,
  micro: 11,
} as const;

export const Radius = {
  small: 8,
  control: 10,
  card: 14,
  panel: 18,
  pill: 999,
} as const;

export const ComponentSize = {
  buttonHeight: 46,
  inputHeight: 48,
  iconButton: 40,
  navigationHeight: 58,
  minimumTouchTarget: Platform.select({ web: 40, default: 44 }) ?? 44,
} as const;

export const Layout = {
  screenHorizontal: 16,
  screenHorizontalCompact: 12,
  screenVertical: 16,
  sectionGap: 20,
  cardPadding: 16,
  cardGap: 12,
  contentMaxWidth: 760,
} as const;
