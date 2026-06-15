import { MetadataRoute } from "next";

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

const isConfigured = () => {
  return typeof TMDB_ACCESS_TOKEN === "string" && TMDB_ACCESS_TOKEN.length > 5;
};

async function fetchTrendingUrls() {
  if (!isConfigured()) return [];
  try {
    const url = `${TMDB_BASE_URL}/trending/all/day`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Sitemap fetch trending error:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://yflix.online";

  // Base homepage route
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Append popular trending movie/TV detail views so they get indexed as crawl paths
  if (isConfigured()) {
    const items = await fetchTrendingUrls();
    items.forEach((item: any) => {
      const mediaType = item.media_type || (item.title ? "movie" : "tv");
      if (item.id && (mediaType === "movie" || mediaType === "tv")) {
        routes.push({
          url: `${baseUrl}/?media=${mediaType}&amp;id=${item.id}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    });
  }

  return routes;
}
