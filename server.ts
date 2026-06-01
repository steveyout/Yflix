import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

// Helper to make secure headers requests to TMDB
async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!isConfigured()) {
    throw new Error("TMDB_ACCESS_TOKEN is missing or unconfigured. Please check environment variables.");
  }

  const queryParams = new URLSearchParams(params).toString();
  const url = `${TMDB_BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ""}`;

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
      throw new Error(`TMDB responded with status ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Fetch failure on endpoint ${endpoint}:`, error);
    throw error;
  }
}

// REST API Proxy Routes

// Trending items API (movies & tv shows combined or separated)
app.get("/api/movies/trending", async (req, res) => {
  try {
    const type = (req.query.type as string) || "all"; // all, movie, tv
    const time_window = (req.query.time_window as string) || "day"; // day, week
    const data = await fetchFromTMDB(`/trending/${type}/${time_window}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch trending items" });
  }
});

// Popular movies or shows
app.get("/api/movies/popular", async (req, res) => {
  try {
    const type = (req.query.type as string) || "movie"; // movie, tv
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
    const type = (req.query.type as string) || "movie"; // movie, tv
    const page = String(req.query.page || "1");
    const data = await fetchFromTMDB(`/${type}/top_rated`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch top-rated items" });
  }
});

// Comprehensive movie search
app.get("/api/movies/search", async (req, res) => {
  try {
    const query = String(req.query.query || "");
    const type = (req.query.type as string) || "multi"; // movie, tv, multi
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
    const type = (req.query.type as string) || "movie"; // movie, tv
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
    const { type, id } = req.params; // movie, tv
    
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
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting Vite Middleware (Development Mode)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] YFlix service available at http://0.0.0.0:${PORT}`);
  });
}

startServer();
