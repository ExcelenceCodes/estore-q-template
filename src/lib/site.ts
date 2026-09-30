import raw from "@/config/site.json";

export type ThemeTokens = Record<string, string>;

export type ThemePreset = {
  label: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

export type NavItem = {
  label: string;
  to: string;
  dynamic?: string;
  requires?: "articles" | "photos";
};

export type SiteConfig = typeof raw & {
  theme: { presets: Record<string, ThemePreset> } & typeof raw.theme;
};

export const site = raw as unknown as SiteConfig;

/** Theme name may be overridden per deployment from .env without touching site.json. */
export function activeThemeName(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta.env?.["VITE_SITE_THEME"] as string | undefined)) ||
    undefined;
  const name = fromEnv || site.theme.active;
  return site.theme.presets[name] ? name : Object.keys(site.theme.presets)[0]!;
}

export function themeNames(): string[] {
  return Object.keys(site.theme.presets);
}

function block(selector: string, tokens: ThemeTokens, radius?: string) {
  const lines = Object.entries(tokens).map(([k, v]) => `--${k}:${v};`);
  if (radius) lines.unshift(`--radius:${radius};`);
  return `${selector}{${lines.join("")}}`;
}

/** CSS injected into <head> so every colour comes from site.json, never from code. */
export function themeCss(themeName = activeThemeName()): string {
  const preset = site.theme.presets[themeName]!;
  const f = site.theme.font;
  const fonts = `:root{--font-heading:"${f.heading}",ui-sans-serif,system-ui,sans-serif;--font-body:"${f.body}",ui-sans-serif,system-ui,sans-serif;--font-mono:"${f.mono}",ui-monospace,monospace;}`;
  return (
    fonts +
    block(":root", preset.light, site.theme.radius) +
    block(".dark", preset.dark, site.theme.radius)
  );
}

export function googleFontsHref(): string {
  const fams = Array.from(new Set([site.theme.font.heading, site.theme.font.body]))
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${fams}&display=swap`;
}

export function pageTitle(title?: string): string {
  if (!title) return site.seo.defaultTitle;
  return site.seo.titleTemplate.replace("%s", title);
}
