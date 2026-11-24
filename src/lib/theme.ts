import type { ThemeConfig } from "antd";

export const PRIMARY = "#6B53D5";
export const INK = "#151716";
export const TRACK_BG = "#efedf4";

const STATUS_COLORS = {
  Success: "#00944f",
  Warning: "#e3a21a",
  Caution: "#fa8c16",
  Error: "#e01a4f",
  Info: PRIMARY,
} as const;

function buildStatusTokens(): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    tokens[`color${key}`] = color;
  }
  return tokens;
}

export const baseTheme: ThemeConfig = {
  cssVar: true,
  token: {
    colorPrimary: PRIMARY,
    colorLink: PRIMARY,
    colorTextBase: INK,
    colorInfo: PRIMARY,
    colorSuccess: STATUS_COLORS.Success,
    colorWarning: STATUS_COLORS.Warning,
    colorError: STATUS_COLORS.Error,
    fontFamily:
      "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeightStrong: 700,
    fontSize: 14,
    borderRadius: 16,
    borderRadiusSM: 12,
    borderRadiusXS: 8,
    borderRadiusLG: 20,
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 44,
    ...buildStatusTokens(),
  },
  components: {
    Button: {
      algorithm: true,
      colorPrimary: INK,
      fontWeight: 600,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      borderRadius: 16,
      borderRadiusSM: 12,
      borderRadiusLG: 18,
      contentFontSizeSM: 13,
      onlyIconSize: 16,
      onlyIconSizeSM: 14,
      onlyIconSizeLG: 18,
    },
    Checkbox: {
      borderRadiusSM: 8,
    },
    Segmented: {
      trackPadding: 3,
      trackBg: TRACK_BG,
      itemColor: "rgba(21, 23, 22, 0.66)",
      itemHoverColor: INK,
      itemHoverBg: "rgba(255, 255, 255, 0.55)",
      itemActiveBg: "rgba(255, 255, 255, 0.8)",
      itemSelectedBg: INK,
      itemSelectedColor: "#ffffff",
    },
    Badge: {
      paddingXS: 3,
      textFontWeight: 500,
    },
    Table: {
      headerBorderRadius: 16,
      cellPaddingInlineMD: 16,
      cellPaddingInlineSM: 12,
    },
  },
};

export const loginTheme: ThemeConfig = {
  ...baseTheme,
  components: {
    ...baseTheme.components,
    Button: {
      ...baseTheme.components?.Button,
      controlHeightLG: 48,
      paddingInlineLG: 15,
    },
  },
};
