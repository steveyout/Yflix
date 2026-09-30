import React from "react";
import AppClient from "../AppClient";
import { headers } from "next/headers";
import { getSiteConfig } from "../lib/siteConfig";

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

const isConfigured = () => {
  return typeof TMDB_ACCESS_TOKEN === "string" && TMDB_ACCESS_TOKEN.length > 5;
};

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!isConfigured()) {
    throw new Error("TMDB_ACCESS_TOKEN is missing or unconfigured.");
  }

  const queryParams = new URLSearchParams(params).toString();
  const url = `${TMDB_BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TMDB responded with status ${response.status}`);
  }

  return await response.json();
}

// 1. Dynamic Server-Side SEO Generation (generateMetadata)
export async function generateMetadata({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const media = resolvedParams?.media;
  const id = resolvedParams?.id;
  const domainParam = resolvedParams?.domain;

  let host = "";
  try {
    const headerList = await headers();
    host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  } catch {
    // fallback
  }

  const site = getSiteConfig(host, domainParam);

  let title = site.title;
  let description = site.description;
  let imageUrl = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=1200";

  if (isConfigured() && media && id) {
    try {
      const detailInfo = await fetchFromTMDB(`/${media}/${id}`);
      if (detailInfo) {
        const itemTitle = detailInfo.title || detailInfo.name;
        const itemOverview = detailInfo.overview;
        title = `${itemTitle} - Watch Free on ${site.brandName}`;
        if (itemOverview) {
          description = itemOverview.slice(0, 160) + (itemOverview.length > 160 ? "..." : "");
        }
        if (detailInfo.backdrop_path) {
          imageUrl = `https://image.tmdb.org/t/p/w1280${detailInfo.backdrop_path}`;
        } else if (detailInfo.poster_path) {
          imageUrl = `https://image.tmdb.org/t/p/w500${detailInfo.poster_path}`;
        }
      }
    } catch (e) {
      console.warn("generateMetadata fail:", e);
    }
  }

  let canonicalUrl = `${site.domain}/`;
  if (media && id) {
    canonicalUrl = `${site.domain}/?media=${media}&id=${id}`;
  }

  return {
    metadataBase: new URL(site.domain),
    title,
    description,
    keywords: site.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      type: "video.movie",
      siteName: site.brandName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

// 2. Dynamic Server-Side Component (Page)
export default async function Page({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const media = resolvedParams?.media;
  const id = resolvedParams?.id;
  const domainParam = resolvedParams?.domain;

  let host = "";
  try {
    const headerList = await headers();
    host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  } catch {
    // fallback
  }

  const site = getSiteConfig(host, domainParam);

  let trending: any[] = [];
  let popularMovies: any[] = [];
  let popularShows: any[] = [];
  let topRated: any[] = [];
  let genres: any[] = [];
  let activeItemInfo: any = null;
  const configStatus = { configured: false, baseUrl: TMDB_BASE_URL };

  try {
    if (isConfigured()) {
      configStatus.configured = true;

      const [
        trendingRes,
        nowPlayingRes,
        popularTVRes,
        topRatedRes,
        movieGenresRes,
        tvGenresRes,
      ] = await Promise.all([
        fetchFromTMDB("/trending/all/day").catch(() => ({ results: [] })),
        fetchFromTMDB("/movie/now_playing").catch(() => ({ results: [] })),
        fetchFromTMDB("/tv/popular").catch(() => ({ results: [] })),
        fetchFromTMDB("/movie/top_rated").catch(() => ({ results: [] })),
        fetchFromTMDB("/genre/movie/list").catch(() => ({ genres: [] })),
        fetchFromTMDB("/genre/tv/list").catch(() => ({ genres: [] })),
      ]);

      trending = trendingRes.results || [];
      popularMovies = (nowPlayingRes.results || []).map((m: any) => ({ ...m, media_type: "movie" }));
      popularShows = (popularTVRes.results || []).map((t: any) => ({ ...t, media_type: "tv" }));
      topRated = (topRatedRes.results || []).map((m: any) => ({ ...m, media_type: "movie" }));

      const combinedGenres = [...(movieGenresRes.genres || []), ...(tvGenresRes.genres || [])];
      genres = combinedGenres.filter((genre, index, self) =>
        self.findIndex((g) => g.id === genre.id) === index
      );

      // Pre-fetch deep link metadata if shared
      if (media && id) {
        try {
          activeItemInfo = await fetchFromTMDB(`/${media}/${id}`);
        } catch (e) {
          console.warn("Error fetching deep link details on server:", e);
        }
      }
    }
  } catch (err) {
    console.error("[Next.js Page SSR Error]:", err);
  }

  // 3. Formulate Rich Schema Markup (JSON-LD) for Search Engines
  const structuredData = activeItemInfo
    ? {
        "@context": "https://schema.org",
        "@type": media === "tv" ? "TVSeries" : "Movie",
        "name": activeItemInfo.title || activeItemInfo.name,
        "image": activeItemInfo.poster_path ? `https://image.tmdb.org/t/p/w500${activeItemInfo.poster_path}` : undefined,
        "description": activeItemInfo.overview,
        "aggregateRating": activeItemInfo.vote_average
          ? {
              "@type": "AggregateRating",
              "ratingValue": activeItemInfo.vote_average.toFixed(1),
              "bestRating": "10",
              "worstRating": "1",
              "ratingCount": activeItemInfo.vote_count || 500,
            }
          : undefined,
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": site.brandName,
        "url": site.domain,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${site.domain}/?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

  return (
    <>
      {/* Inject Structured Metadata schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <AppClient
        initialTrending={trending}
        initialPopularMovies={popularMovies}
        initialPopularShows={popularShows}
        initialTopRated={topRated}
        initialConfigStatus={configStatus}
        initialGenres={genres}
        initialSiteConfig={site}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
