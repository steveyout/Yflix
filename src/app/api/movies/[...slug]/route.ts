import { NextRequest, NextResponse } from "next/server";

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

const isConfigured = () => {
  return typeof TMDB_ACCESS_TOKEN === "string" && TMDB_ACCESS_TOKEN.length > 5;
};

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!isConfigured()) {
    throw new Error("TMDB_ACCESS_TOKEN is missing or unconfigured. Please check environment variables.");
  }

  const queryParams = new URLSearchParams(params).toString();
  const url = `${TMDB_BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ""}`;

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TMDB API Error details for ${endpoint}: Status ${response.status}`, errorText);
        
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
        throw new Error(`TMDB responded with status ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      const isLastAttempt = attempt === MAX_RETRIES;
      if (!isLastAttempt) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      throw error;
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { slug } = await params;
    
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: "Invalid API path" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = slug[0];

    // 1. Trending items
    if (action === "trending") {
      const type = searchParams.get("type") || "all";
      const time_window = searchParams.get("time_window") || "day";
      const data = await fetchFromTMDB(`/trending/${type}/${time_window}`);
      return NextResponse.json(data);
    }

    // 2. Popular movies/shows
    if (action === "popular") {
      const type = searchParams.get("type") || "movie";
      const page = searchParams.get("page") || "1";
      const data = await fetchFromTMDB(`/${type}/popular`, { page });
      return NextResponse.json(data);
    }

    // 3. Top Rated movies/shows
    if (action === "top-rated") {
      const type = searchParams.get("type") || "movie";
      const page = searchParams.get("page") || "1";
      const data = await fetchFromTMDB(`/${type}/top_rated`, { page });
      return NextResponse.json(data);
    }

    // 4. Now playing
    if (action === "now-playing") {
      const page = searchParams.get("page") || "1";
      const data = await fetchFromTMDB("/movie/now_playing", { page });
      return NextResponse.json(data);
    }

    // 5. Upcoming
    if (action === "upcoming") {
      const page = searchParams.get("page") || "1";
      const data = await fetchFromTMDB("/movie/upcoming", { page });
      return NextResponse.json(data);
    }

    // 6. Trending TV Shows
    if (action === "trending-tv") {
      const time_window = searchParams.get("time_window") || "day";
      const data = await fetchFromTMDB(`/trending/tv/${time_window}`);
      return NextResponse.json(data);
    }

    // 7. Popular TV Shows
    if (action === "popular-tv") {
      const page = searchParams.get("page") || "1";
      const data = await fetchFromTMDB("/tv/popular", { page });
      return NextResponse.json(data);
    }

    // 8. Top Rated TV Shows
    if (action === "top-rated-tv") {
      const page = searchParams.get("page") || "1";
      const data = await fetchFromTMDB("/tv/top_rated", { page });
      return NextResponse.json(data);
    }

    // 9. Search
    if (action === "search") {
      const query = searchParams.get("query") || "";
      const type = searchParams.get("type") || "multi";
      const page = searchParams.get("page") || "1";
      if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
      }
      const data = await fetchFromTMDB(`/search/${type}`, { query, page, include_adult: "false" });
      return NextResponse.json(data);
    }

    // 10. Genres
    if (action === "genres") {
      const [movieGenres, tvGenres] = await Promise.all([
        fetchFromTMDB("/genre/movie/list"),
        fetchFromTMDB("/genre/tv/list"),
      ]);
      return NextResponse.json({
        movie: movieGenres.genres || [],
        tv: tvGenres.genres || [],
      });
    }

    // 11. Genre discover
    if (action === "genre" && slug[1]) {
      const genreId = slug[1];
      const type = searchParams.get("type") || "movie";
      const page = searchParams.get("page") || "1";
      const data = await fetchFromTMDB(`/discover/${type}`, {
        with_genres: genreId,
        page,
        sort_by: "popularity.desc",
        include_adult: "false",
      });
      return NextResponse.json(data);
    }

    // 12. Movie & series dynamic aggregated details
    if (action === "details" && slug[1] && slug[2]) {
      const mediaType = slug[1];
      const id = slug[2];
      const [details, credits, recommendations, videos] = await Promise.all([
        fetchFromTMDB(`/${mediaType}/${id}`),
        fetchFromTMDB(`/${mediaType}/${id}/credits`).catch(() => ({ cast: [], crew: [] })),
        fetchFromTMDB(`/${mediaType}/${id}/recommendations`).catch(() => ({ results: [] })),
        fetchFromTMDB(`/${mediaType}/${id}/videos`).catch(() => ({ results: [] })),
      ]);
      return NextResponse.json({
        details,
        credits,
        recommendations,
        videos,
      });
    }

    // 13. TV Season episodes
    if (action === "tv" && slug[1] && slug[2] === "season" && slug[3]) {
      const id = slug[1];
      const season_number = slug[3];
      const data = await fetchFromTMDB(`/tv/${id}/season/${season_number}`);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  } catch (err: any) {
    console.error("[Next.js Proxy Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to process movie endpoint" }, { status: 500 });
  }
}
