import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { Film, Tv, Library, History, AlertCircle, Sparkles, Flame, ThumbsUp, HelpCircle, HeartOff, SearchCode, Eye, Play, Trash2 } from "lucide-react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MovieRow from "./components/MovieRow";
import DetailModal from "./components/DetailModal";
import PlayerView from "./components/PlayerView";
import AdBanner from "./components/AdBanner";
import { SkeletonHero, SkeletonRow, SkeletonGrid } from "./components/Skeletons";
import { MovieOrTV, Season } from "./types/movie";

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "movie" | "tv" | "watchlist" | "history">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MovieOrTV[]>([]);
  const [searching, setSearching] = useState(false);
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; baseUrl: string } | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Home Lists State
  const [trending, setTrending] = useState<MovieOrTV[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieOrTV[]>([]);
  const [popularShows, setPopularShows] = useState<MovieOrTV[]>([]);
  const [topRated, setTopRated] = useState<MovieOrTV[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);

  // Selected Genre for discover
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [genreDiscoveredItems, setGenreDiscoveredItems] = useState<MovieOrTV[]>([]);
  const [loadingGenreDiscover, setLoadingGenreDiscover] = useState(false);

  // Modals & Navigation State
  const [selectedMedia, setSelectedMedia] = useState<MovieOrTV | null>(null);
  const [playingMedia, setPlayingMedia] = useState<MovieOrTV | null>(null);
  const [playingSeasonsDetail, setPlayingSeasonsDetail] = useState<Season[]>([]);

  // Watchlist & History
  const [watchlist, setWatchlist] = useState<MovieOrTV[]>([]);
  const [playbackHistory, setPlaybackHistory] = useState<
    { item: MovieOrTV; watchedAt: string; season?: number; episode?: number }[]
  >([]);

  // 1. Initial State Hydration (Watchlist & History)
  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem("yflix-watchlist");
      if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));

      const storedHistory = localStorage.getItem("yflix-history");
      if (storedHistory) setPlaybackHistory(JSON.parse(storedHistory));
    } catch (e) {
      console.error("Localstorage recovery failed:", e);
    }
  }, []);

  // 2. Refresh Config & Media collections on launch
  useEffect(() => {
    // Check config status
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((status) => setConfigStatus(status))
      .catch((err) => console.error("Config status check fail:", err));

    // Fetch lists
    const p1 = fetch("/api/movies/trending")
      .then((res) => res.json())
      .then((data) => setTrending(data.results || []))
      .catch((err) => console.error("Failed to load trending highlights:", err));

    const p2 = fetch("/api/movies/popular?type=movie")
      .then((res) => res.json())
      .then((data) => setPopularMovies((data.results || []).map((m: any) => ({ ...m, media_type: "movie" }))))
      .catch((err) => console.error("Failed to load popular movies:", err));

    const p3 = fetch("/api/movies/popular?type=tv")
      .then((res) => res.json())
      .then((data) => setPopularShows((data.results || []).map((t: any) => ({ ...t, media_type: "tv" }))))
      .catch((err) => console.error("Failed to load popular TV:", err));

    const p4 = fetch("/api/movies/top-rated?type=movie")
      .then((res) => res.json())
      .then((data) => setTopRated((data.results || []).map((m: any) => ({ ...m, media_type: "movie" }))))
      .catch((err) => console.error("Failed to load top-rated movies:", err));

    const p5 = fetch("/api/movies/genres")
      .then((res) => res.json())
      .then((data) => {
        // combine unique genres
        const combined = [...(data.movie || []), ...(data.tv || [])];
        const unique = combined.filter((genre, index, self) =>
          self.findIndex((g) => g.id === genre.id) === index
        );
        setGenres(unique);
      })
      .catch((err) => console.error("Failed to load genres:", err));

    Promise.allSettled([p1, p2, p3, p4, p5]).then(() => {
      setLoadingInitial(false);
    });
  }, []);

  // Discover movies by genre
  useEffect(() => {
    if (selectedGenreId) {
      setLoadingGenreDiscover(true);
      const categoryType = activeTab === "tv" ? "tv" : "movie";
      fetch(`/api/movies/genre/${selectedGenreId}?type=${categoryType}`)
        .then((res) => res.json())
        .then((data) => {
          setGenreDiscoveredItems((data.results || []).map((item: any) => ({ ...item, media_type: categoryType })));
        })
        .catch((err) => console.error("Genre discover fetch failed:", err))
        .finally(() => setLoadingGenreDiscover(false));
    } else {
      setGenreDiscoveredItems([]);
    }
  }, [selectedGenreId, activeTab]);

  // Handle Search Input throttling
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const delayDebounce = setTimeout(() => {
      fetch(`/api/movies/search?query=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.results || []);
        })
        .catch((err) => console.error("Search API reporting errors:", err))
        .finally(() => setSearching(false));
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Bookmark Toggle
  const toggleWatchlist = (item: MovieOrTV) => {
    const updated = [...watchlist];
    const index = updated.findIndex((x) => x.id === item.id);
    if (index > -1) {
      updated.splice(index, 1);
    } else {
      updated.unshift(item);
    }
    setWatchlist(updated);
    localStorage.setItem("yflix-watchlist", JSON.stringify(updated));
  };

  // Launch Stream/Player view from click
  const handlePlayMedia = (item: MovieOrTV, seasons?: any[]) => {
    // Set type if undefined
    const inferredType = item.media_type || (item.first_air_date ? "tv" : "movie");
    const itemWithMedia = { ...item, media_type: inferredType };
    
    setPlayingMedia(itemWithMedia);
    setPlayingSeasonsDetail(seasons || []);
    setSelectedMedia(null); // Close details modal if open

    // Log base watch action
    logPlaybackHistory(itemWithMedia);
  };

  // Track playback history
  const logPlaybackHistory = (item: MovieOrTV, season?: number, episode?: number) => {
    const updated = [...playbackHistory];
    
    // Check if duplicate exists (remove matching media)
    const index = updated.findIndex((x) => x.item.id === item.id);
    if (index > -1) {
      updated.splice(index, 1);
    }

    // append new entry in history
    updated.unshift({
      item,
      watchedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      season,
      episode,
    });

    setPlaybackHistory(updated);
    localStorage.setItem("yflix-history", JSON.stringify(updated));
  };

  const removeHistoryItem = (itemId: number) => {
    const updated = playbackHistory.filter((x) => x.item.id !== itemId);
    setPlaybackHistory(updated);
    localStorage.setItem("yflix-history", JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setPlaybackHistory([]);
    localStorage.removeItem("yflix-history");
  };

  const watchlistIds = watchlist.map((x) => x.id);

  // If streaming mode is active, display player with zero clutter
  if (playingMedia) {
    return (
      <PlayerView
        mediaType={playingMedia.media_type!}
        mediaId={playingMedia.id}
        title={playingMedia.title || playingMedia.name || "Cinema Presentation"}
        backdropPath={playingMedia.backdrop_path}
        tagline={playingMedia.overview}
        seasons={playingSeasonsDetail}
        onBack={() => setPlayingMedia(null)}
        onLoggedWatchedEpisode={(s, ep) => logPlaybackHistory(playingMedia, s, ep)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      
      {/* Shared header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedGenreId(null);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        configStatus={configStatus}
        onRefresh={() => window.location.reload()}
      />

      {/* Main body viewport */}
      <main className="flex-1 pb-16">
        {/* API configure alert */}
        {configStatus && !configStatus.configured && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-rose-500/25 bg-rose-950/15 p-4 text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="text-center sm:text-left text-xs md:text-sm">
                <strong className="font-extrabold text-white">TMDB Access Token is unconfigured. </strong>
                Please provide your <code className="bg-rose-950/40 px-1 py-0.5 rounded font-mono text-white text-[11px]">TMDB_ACCESS_TOKEN</code> in your environment variable settings to fetch authenticated movie parameters.
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW RANGE SWITCHER --- */}

        {/* 1. Search Result Mode */}
        {searchQuery ? (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12">
            <div className="flex items-center gap-2 mb-6">
              <SearchCode className="h-5 w-5 text-red-500" />
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase">
                Search Results for: <span className="text-red-500 font-extrabold">"{searchQuery}"</span>
              </h2>
            </div>

            {searching ? (
              <SkeletonGrid count={12} />
            ) : searchResults.length === 0 ? (
              <div className="py-24 text-center rounded-2xl border border-zinc-900/40 bg-zinc-950/30 p-12 space-y-2">
                <HeartOff className="mx-auto h-12 w-12 text-zinc-700" />
                <h3 className="text-base font-bold text-zinc-300">No results found</h3>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                  Verify the spelling, adjust keywords, or try searching for another title.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className="relative rounded-xl overflow-hidden aspect-[2/3] border border-zinc-900 bg-zinc-950 group cursor-pointer hover:border-red-600 transition-all hover:-translate-y-1"
                  >
                    <img
                      src={
                        item.poster_path
                          ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                          : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=300"
                      }
                      alt={item.title || item.name}
                      className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-all duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-3 gap-0.5">
                      <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white w-max">
                        {item.media_type === "tv" || item.first_air_date ? "Series" : "Movie"}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1 truncate leading-tight pt-1">
                        {item.title || item.name || "Untitled"}
                      </h4>
                      {item.vote_average > 0 && (
                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                          ★ {item.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Segmented Tabs Layout */
          <>
            {/* Tab: HOME view */}
            {activeTab === "home" && (
              loadingInitial ? (
                <div className="space-y-6">
                  <SkeletonHero />
                  <SkeletonRow title="Popular Movies" />
                  <SkeletonRow title="Top Rated Classics" />
                  <SkeletonRow title="Trending Serials" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Hero Showcase Carousel */}
                  <Hero
                    items={trending.slice(0, 7)}
                    onPlay={handlePlayMedia}
                    onSelect={setSelectedMedia}
                    watchlistIds={watchlistIds}
                    toggleWatchlist={toggleWatchlist}
                  />

                  {/* Genres Quick Filter Slider */}
                  <div className="px-4 sm:px-6 md:px-12 pt-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-rose-500" />
                      <h3 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Browse by Category</h3>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none" style={{ scrollbarWidth: 'none' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedGenreId(null)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer shrink-0 ${
                          selectedGenreId === null
                            ? "bg-red-600 border-red-650 text-white shadow-lg shadow-red-600/20"
                            : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20"
                        }`}
                      >
                        All Classes
                      </button>
                      {genres.slice(0, 16).map((genre) => (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => setSelectedGenreId(genre.id)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer shrink-0 ${
                            selectedGenreId === genre.id
                              ? "bg-red-600 border-red-650 text-white shadow-lg shadow-red-600/20"
                              : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Genre discovered items vs default lists */}
                  {selectedGenreId !== null ? (
                    <div className="px-4 sm:px-6 md:px-12 py-3">
                      <div className="flex items-center gap-2 mb-4">
                        <Flame className="h-4 w-4 text-red-500" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                          Discovered Category Hits
                        </h3>
                      </div>

                      {loadingGenreDiscover ? (
                        <SkeletonGrid count={12} />
                      ) : genreDiscoveredItems.length === 0 ? (
                        <div className="text-center py-16 text-zinc-500 text-xs font-semibold">
                          No movie titles cataloged under this genre.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                          {genreDiscoveredItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedMedia(item)}
                              className="relative rounded-xl overflow-hidden aspect-[2/3] border border-white/10 bg-white/5 group cursor-pointer hover:border-red-600 transition-all duration-300"
                            >
                              <img
                                src={
                                  item.poster_path
                                    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                                    : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=300"
                                }
                                alt={item.title || item.name}
                                className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-all"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-2.5">
                                <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">{item.title || item.name}</h4>
                                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">★ {item.vote_average.toFixed(1)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Default Rows */}
                      <MovieRow
                        title="Popular Movies"
                        items={popularMovies}
                        onPlay={handlePlayMedia}
                        onSelect={setSelectedMedia}
                        watchlistIds={watchlistIds}
                        toggleWatchlist={toggleWatchlist}
                      />

                      <MovieRow
                        title="Top Rated Classics"
                        items={topRated}
                        onPlay={handlePlayMedia}
                        onSelect={setSelectedMedia}
                        watchlistIds={watchlistIds}
                        toggleWatchlist={toggleWatchlist}
                      />

                      <MovieRow
                        title="Trending Serials"
                        items={popularShows}
                        onPlay={handlePlayMedia}
                        onSelect={setSelectedMedia}
                        watchlistIds={watchlistIds}
                        toggleWatchlist={toggleWatchlist}
                      />
                    </div>
                  )}
                </div>
              )
            )}

            {/* Tab: MOVIES page */}
            {activeTab === "movie" && (
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2">
                    <Film className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg md:text-xl font-black tracking-tight text-white uppercase">Movies Catalog</h2>
                  </div>

                  {/* Filter pills */}
                  <div className="flex gap-1.5 overflow-x-auto leading-normal">
                    <button
                      onClick={() => setSelectedGenreId(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                        selectedGenreId === null 
                          ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20" 
                          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      All Genres
                    </button>
                    {genres.slice(0, 8).map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => setSelectedGenreId(genre.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                          selectedGenreId === genre.id 
                            ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20" 
                            : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedGenreId !== null ? (
                  loadingGenreDiscover ? (
                    <SkeletonGrid count={12} />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {genreDiscoveredItems.map((movie) => (
                        <div
                          key={movie.id}
                          onClick={() => setSelectedMedia(movie)}
                          className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-[#0f0f0f] group cursor-pointer hover:border-red-600 transition-all"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                            alt={movie.title}
                            className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-all"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-2.5">
                            <span className="text-[10px] text-white font-bold truncate">{movie.title}</span>
                            <span className="text-[9px] text-amber-500 font-bold">★ {movie.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  loadingInitial ? (
                    <SkeletonGrid count={12} />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {popularMovies.map((movie) => (
                        <div
                          key={movie.id}
                          onClick={() => setSelectedMedia(movie)}
                          className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-[#0f0f0f] group cursor-pointer hover:border-red-600 transition-all"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                            alt={movie.title}
                            className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-all"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-2.5">
                            <span className="text-[10px] text-white font-bold truncate">{movie.title}</span>
                            <span className="text-[9px] text-amber-500 font-bold">★ {movie.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Tab: TV SHOWS page */}
            {activeTab === "tv" && (
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2">
                    <Tv className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg md:text-xl font-black tracking-tight text-white uppercase">Television Series</h2>
                  </div>

                  {/* Filter pills */}
                  <div className="flex gap-1.5 overflow-x-auto leading-normal">
                    <button
                      onClick={() => setSelectedGenreId(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                        selectedGenreId === null 
                          ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20" 
                          : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      All Broadcasts
                    </button>
                    {genres.slice(8, 16).map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => setSelectedGenreId(genre.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                          selectedGenreId === genre.id 
                            ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20" 
                            : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedGenreId !== null ? (
                  loadingGenreDiscover ? (
                    <SkeletonGrid count={12} />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {genreDiscoveredItems.map((tv) => (
                        <div
                          key={tv.id}
                          onClick={() => setSelectedMedia(tv)}
                          className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-[#0f0f0f] group cursor-pointer hover:border-red-600 transition-all"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w300${tv.poster_path}`}
                            alt={tv.name}
                            className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-all"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-2.5">
                            <span className="text-[10px] text-white font-bold truncate">{tv.name}</span>
                            <span className="text-[9px] text-amber-500 font-bold">★ {tv.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  loadingInitial ? (
                    <SkeletonGrid count={12} />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {popularShows.map((tv) => (
                        <div
                          key={tv.id}
                          onClick={() => setSelectedMedia(tv)}
                          className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-[#0f0f0f] group cursor-pointer hover:border-red-600 transition-all"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w300${tv.poster_path}`}
                            alt={tv.name}
                            className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-all"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-2.5">
                            <span className="text-[10px] text-white font-bold truncate">{tv.name}</span>
                            <span className="text-[9px] text-amber-500 font-bold">★ {tv.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Tab: WATCHLIST review */}
            {activeTab === "watchlist" && (
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12 space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-4">
                  <Library className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg md:text-xl font-black tracking-tight text-white uppercase">My Bookmarked Watchlist</h2>
                </div>

                {watchlist.length === 0 ? (
                  <div className="py-24 text-center rounded-2xl border border-white/10 bg-[#0f0f0f]/40 p-12 space-y-3 shadow-xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 mx-auto">
                      <Library className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-white/90">Your Watchlist is empty</h3>
                    <p className="text-white/40 text-xs max-w-xs mx-auto">
                      Stream list parameters. Toggle bookmark icons on any movie or TV series detail card to list them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {watchlist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMedia(item)}
                        className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-[#0f0f0f] group cursor-pointer hover:border-red-600 transition-all"
                      >
                        <img
                          src={
                            item.poster_path
                              ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                              : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=300"
                          }
                          alt={item.title || item.name}
                          className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-all"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent flex flex-col justify-end p-2.5">
                          <span className="text-[10px] text-white font-bold truncate">{item.title || item.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(item);
                            }}
                            className="bg-black/80 hover:bg-red-600 border border-white/10 text-white/70 hover:text-white rounded px-2.5 py-1 text-[9px] font-black tracking-wide mt-1.5 transition-all self-start cursor-pointer"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: RECENT HISTORY page */}
            {activeTab === "history" && (
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg md:text-xl font-black tracking-tight text-white uppercase">History Stream Tracking</h2>
                  </div>

                  {playbackHistory.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-950 bg-red-950/20 px-3.5 py-1.5 text-xs font-black tracking-wide text-red-400 hover:bg-red-900 hover:text-white transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>CLEAR LOGS</span>
                    </button>
                  )}
                </div>

                {playbackHistory.length === 0 ? (
                  <div className="py-24 text-center rounded-2xl border border-white/10 bg-[#0f0f0f]/40 p-12 space-y-3 shadow-xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 mx-auto">
                      <History className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-white/90">No stream history cataloged</h3>
                    <p className="text-white/40 text-xs max-w-xs mx-auto">
                      Start watching a cinema film or series episode, and we will securely log your dynamic progress.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {playbackHistory.map((itemObj) => {
                      const record = itemObj.item;
                      const hasDetails = itemObj.season !== undefined && itemObj.episode !== undefined;
                      const backdrop = record.backdrop_path
                        ? `https://image.tmdb.org/t/p/w300${record.backdrop_path}`
                        : record.poster_path
                        ? `https://image.tmdb.org/t/p/w300${record.poster_path}`
                        : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=300";

                      return (
                        <div
                          key={record.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 py-4"
                        >
                          {/* Banner backdrop preview */}
                          <div className="relative w-full sm:w-36 aspect-video bg-white/5 border border-white/10 rounded-xl overflow-hidden pointer-events-none group">
                            <img
                              src={backdrop}
                              alt={record.title || record.name}
                              className="h-full w-full object-cover opacity-60"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Eye className="h-5 w-5 text-red-500 animate-pulse" />
                            </div>
                          </div>

                          {/* Historical context description */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-red-600/20 border border-red-600/30 px-1.5 py-0.5 text-[9px] font-bold text-red-500 uppercase">
                                {record.media_type === "tv" ? "TV Series" : "Movie"}
                              </span>
                              <span className="text-[10px] text-white/40 font-semibold uppercase">
                                Streamed: {itemObj.watchedAt}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-white">
                              {record.title || record.name}
                            </h3>

                            {hasDetails && (
                              <p className="text-xs font-bold text-white/70">
                                Latest scene:{" "}
                                <span className="text-red-500 font-extrabold pb-0.5">
                                  Season {itemObj.season}, Episode {itemObj.episode}
                                </span>
                              </p>
                            )}

                            <p className="text-xs text-white/40 leading-relaxed line-clamp-1 max-w-xl">
                              {record.overview || "This historical logging segment lacks description strings."}
                            </p>
                          </div>

                          {/* Controls buttons */}
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <button
                              type="button"
                              onClick={() => handlePlayMedia(record)}
                              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-white/90 text-black px-4 py-2 text-xs font-black uppercase transition-all shadow-md"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>RESUME</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => removeHistoryItem(record.id)}
                              title="Delete log record"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-red-500 hover:border-white/20 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ADS SECTOR BANNER FOR MONETIZATION */}
      <div className="px-4 sm:px-8 mt-12">
        <AdBanner zoneKey="45848b4da681507c529679c16f48f951" width={728} height={90} />
      </div>

      {/* FOOTER METRICS IN TUNE WITH PRO DESIGN PANEL */}
      <footer className="w-full h-16 bg-[#0f0f0f] border-t border-white/5 px-4 sm:px-8 mt-12 flex items-center justify-between text-[10px] font-medium tracking-wide uppercase select-none">
        <div className="flex items-center gap-6 text-white/40">
          <span>API: TMDB v3 Connected</span>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-[9px] font-bold">System Online</span>
          </div>
        </div>
        <div className="text-white/30 font-black">
          © 2026 YFLIX CLONE &bull; ALL RIGHTS DIRECTED
        </div>
      </footer>

      {/* --- FLOATING DETAILS OVERLAYS --- */}
      <AnimatePresence>
        {selectedMedia && (
          <DetailModal
            item={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            onPlay={handlePlayMedia}
            watchlistIds={watchlistIds}
            toggleWatchlist={toggleWatchlist}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
