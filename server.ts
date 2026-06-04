import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import http from "http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

// Logging middleware
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.path}`);
  next();
});

// Helper to check for configuration
const isConfigured = () => {
  return typeof TMDB_ACCESS_TOKEN === "string" && TMDB_ACCESS_TOKEN.length > 5;
};

// API Status Route
app.get("/api/config-status", (req, res) => {
  res.json({
    configured: isConfigured(),
    baseUrl: TMDB_BASE_URL,
  });
});

// Helper to make secure headers requests to TMDB with automatic retries for transient failures
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

        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          console.warn(`[Backend API Retry] TMDB returned status ${response.status}. Retrying ${attempt + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms... URL: ${url}`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
        throw new Error(`TMDB responded with status ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      const isLastAttempt = attempt === MAX_RETRIES;
      if (!isLastAttempt) {
        console.warn(`[Backend API Retry] Fetch failure on ${endpoint} (${error.message || error}). Retrying ${attempt + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      console.error(`[Backend API Error] Max retries reached or unrecoverable fetch failure on endpoint ${endpoint}:`, error);
      throw error;
    }
  }
}

// REST API Proxy Routes

// Trending items API (movies & tv shows combined or separated)
app.get("/api/movies/trending", async (req, res) => {
  try {
    const type = (req.query.type as string) || "all";
    const time_window = (req.query.time_window as string) || "day";
    const data = await fetchFromTMDB(`/trending/${type}/${time_window}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch trending items" });
  }
});

// Popular movies or shows
app.get("/api/movies/popular", async (req, res) => {
  try {
    const type = (req.query.type as string) || "movie";
    const page = String(req.query.page || "1");
    const data = await fetchFromTMDB(`/${type}/popular`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch popular items" });
  }
});

// Top Rated movies or shows
app.get("/api/movies/top-rated", async (req, res) => {
  try {
    const type = (req.query.type as string) || "movie";
    const page = String(req.query.page || "1");
    const data = await fetchFromTMDB(`/${type}/top_rated`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch top-rated items" });
  }
});

// Now Playing items API
app.get("/api/movies/now-playing", async (req, res) => {
  try {
    const page = String(req.query.page || "1");
    const data = await fetchFromTMDB("/movie/now_playing", { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch now playing items" });
  }
});

// Upcoming items API
app.get("/api/movies/upcoming", async (req, res) => {
  try {
    const page = String(req.query.page || "1");
    const data = await fetchFromTMDB("/movie/upcoming", { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch upcoming items" });
  }
});

// Trending TV shows API
app.get("/api/movies/trending-tv", async (req, res) => {
  try {
    const time_window = (req.query.time_window as string) || "day";
    const data = await fetchFromTMDB(`/trending/tv/${time_window}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch trending tv shows" });
  }
});

// Popular TV shows API
app.get("/api/movies/popular-tv", async (req, res) => {
  try {
    const page = String(req.query.page || "1");
    const data = await fetchFromTMDB("/tv/popular", { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch popular tv shows" });
  }
});

// Top Rated TV shows API
app.get("/api/movies/top-rated-tv", async (req, res) => {
  try {
    const page = String(req.query.page || "1");
    const data = await fetchFromTMDB("/tv/top_rated", { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch top-rated tv shows" });
  }
});

// Comprehensive movie search
app.get("/api/movies/search", async (req, res) => {
  try {
    const query = String(req.query.query || "");
    const type = (req.query.type as string) || "multi";
    const page = String(req.query.page || "1");

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const data = await fetchFromTMDB(`/search/${type}`, { query, page, include_adult: "false" });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to search movies" });
  }
});

// genres for movies and tv
app.get("/api/movies/genres", async (req, res) => {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      fetchFromTMDB("/genre/movie/list"),
      fetchFromTMDB("/genre/tv/list"),
    ]);
    res.json({
      movie: movieGenres.genres || [],
      tv: tvGenres.genres || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch genres" });
  }
});

// fetch by genre ID
app.get("/api/movies/genre/:id", async (req, res) => {
  try {
    const genreId = req.params.id;
    const type = (req.query.type as string) || "movie";
    const page = String(req.query.page || "1");

    const data = await fetchFromTMDB(`/discover/${type}`, {
      with_genres: genreId,
      page,
      sort_by: "popularity.desc",
      include_adult: "false",
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to discover genre" });
  }
});

// complete detailed compilation endpoint
app.get("/api/movies/details/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;

    const [details, credits, recommendations, videos] = await Promise.all([
      fetchFromTMDB(`/${type}/${id}`),
      fetchFromTMDB(`/${type}/${id}/credits`).catch(() => ({ cast: [], crew: [] })),
      fetchFromTMDB(`/${type}/${id}/recommendations`).catch(() => ({ results: [] })),
      fetchFromTMDB(`/${type}/${id}/videos`).catch(() => ({ results: [] })),
    ]);

    res.json({
      details,
      credits,
      recommendations,
      videos,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch details summary" });
  }
});

// TV Season details (fetching episodes directly)
app.get("/api/movies/tv/:id/season/:season_number", async (req, res) => {
  try {
    const { id, season_number } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/season/${season_number}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch season episodes" });
  }
});

// Serve Frontend Bundle
async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting Vite Middleware (Development Mode)");

    // FIX: Instead of manually interception and binding 'upgrade',
    // passing the server directly to Vite allows it to handle everything cleanly and type-safely.
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server } // <-- Directly hooks Vite HMR websocket handling onto our HTTP server instance
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    console.log("[Server] Serving Compiled Assets (Production Mode)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] YFlix service available at http://0.0.0.0:${PORT}`);
  });
}

startServer();
