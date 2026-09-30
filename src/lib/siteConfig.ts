export interface SiteConfig {
  brandName: string;
  brandUpper: string;
  domain: string;
  hostName: string;
  title: string;
  description: string;
  heroBadge: string;
  keywords: string[];
}

export const MOVY_CONFIG: SiteConfig = {
  brandName: "Movy",
  brandUpper: "MOVY",
  domain: "https://movy.live",
  hostName: "movy.live",
  title: "Movy | Watch Free Movies and TV Shows Online",
  description: "Movy offers free access to the latest movies and TV shows in high quality. Enjoy a vast library of entertainment with instant streaming.",
  heroBadge: "Featured on Movy",
  keywords: [
    "movy",
    "movy.live",
    "free movies",
    "watch tv shows online",
    "streaming site",
    "high quality movies",
    "entertainment",
  ],
};

export const YFLIX_CONFIG: SiteConfig = {
  brandName: "YFlix",
  brandUpper: "YFLIX",
  domain: "https://yflix.online",
  hostName: "yflix.online",
  title: "YFlix | Watch Free Movies and TV Shows Online",
  description: "YFlix offers free access to the latest movies and TV shows in high quality. Enjoy a vast library of entertainment with instant streaming.",
  heroBadge: "Featured on YFlix",
  keywords: [
    "yflix",
    "yflix.online",
    "free movies",
    "watch tv shows online",
    "streaming site",
    "high quality movies",
    "entertainment",
  ],
};

/**
 * Returns the site configuration based on host/domain string or query param.
 * If 'yflix' is found in host or domain parameter, returns YFLIX_CONFIG.
 * Otherwise returns MOVY_CONFIG.
 */
export function getSiteConfig(host?: string | null, domainParam?: string | null): SiteConfig {
  const target = `${domainParam || ""} ${host || ""}`.toLowerCase();
  if (target.includes("yflix")) {
    return YFLIX_CONFIG;
  }
  return MOVY_CONFIG;
}
