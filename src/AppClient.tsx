"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Film, Tv, Library, History, AlertCircle, Sparkles, Flame, ThumbsUp, HelpCircle, HeartOff, SearchCode, Eye, Play, Trash2, ArrowUp } from "lucide-react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MovieRow from "./components/MovieRow";
import DetailModal from "./components/DetailModal";
import PlayerView from "./components/PlayerView";
import AdBanner from "./components/AdBanner";
import { SkeletonHero, SkeletonRow, SkeletonGrid } from "./components/Skeletons";
import { MovieOrTV, Season } from "./types/movie";
import { getEmbedUrl } from "./config/providers";
import api from "./api";

interface AppClientProps {
  initialTrending?: MovieOrTV[];
  initialPopularMovies?: MovieOrTV[];
  initialPopularShows?: MovieOrTV[];
  initialTopRated?: MovieOrTV[];
  initialConfigStatus?: { configured: boolean; baseUrl: string };
  initialGenres?: { id: number; name: string }[];
}

export default function App({
  initialTrending = [],
  initialPopularMovies = [],
  initialPopularShows = [],
  initialTopRated = [],
  initialConfigStatus = null as any,
  initialGenres = [],
}: AppClientProps) {
  const [activeTab, setActiveTab] = useState<"home" | "movie" | "tv" | "watchlist" | "history">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MovieOrTV[]>([]);
  const [searching, setSearching] = useState(false);
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; baseUrl: string } | null>(initialConfigStatus);
  const [loadingInitial, setLoadingInitial] = useState(() => !initialTrending || initialTrending.length === 0);
  const [isLoading, setIsLoading] = useState(() => !initialTrending || initialTrending.length === 0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hoveredHistoryId, setHoveredHistoryId] = useState<number | null>(null);
  const [miniPlayerHistoryId, setMiniPlayerHistoryId] = useState<number | null>(null);

  // Home Lists State
  const [trending, setTrending] = useState<MovieOrTV[]>(initialTrending);
  const [popularMovies, setPopularMovies] = useState<MovieOrTV[]>(initialPopularMovies);
  const [popularShows, setPopularShows] = useState<MovieOrTV[]>(initialPopularShows);
  const [topRated, setTopRated] = useState<MovieOrTV[]>(initialTopRated);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>(initialGenres);

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

  // Back to Top button scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 2. Refresh Config & Media collections on launch
  useEffect(() => {
    const fetchMovieCatalog = async () => {
      if (initialTrending && initialTrending.length > 0) {
        setIsLoading(false);
        setLoadingInitial(false);
        return;
      }
      setIsLoading(true);
      try {
        // Concurrently query proxied endpoints
        const [
          trendingRes, 
          nowPlayingRes, 
          topRatedRes, 
          upcomingRes,
          trendingTVRes,
          popularTVRes,
          topRatedTVRes,
          configStatusRes,
          genresRes
        ] = await Promise.all([
          api.getTrending().catch(() => ({ results: [] })),
          api.getNowPlaying().catch(() => ({ results: [] })),
          api.getTopRated().catch(() => ({ results: [] })),
          api.getUpcoming().catch(() => ({ results: [] })),
          api.getTrendingTV().catch(() => ({ results: [] })),
          api.getPopularTV().catch(() => ({ results: [] })),
          api.getTopRatedTV().catch(() => ({ results: [] })),
          api.getConfigStatus().catch(() => ({ configured: false, baseUrl: "" })),
          api.getGenres().catch(() => ({ movie: [], tv: [] }))
        ]);

        const trendingList = trendingRes.results || [];
        const nowPlayingList = nowPlayingRes.results || [];
        const topRatedList = topRatedRes.results || [];
        const upcomingList = upcomingRes.results || [];
        const trendingTVList = trendingTVRes.results || [];
        const popularTVList = popularTVRes.results || [];
        const topRatedTVList = topRatedTVRes.results || [];

        // Map responses to original application States
        setTrending(trendingList);
        setPopularMovies(nowPlayingList.map((m: any) => ({ ...m, media_type: "movie" })));
        setPopularShows(popularTVList.map((t: any) => ({ ...t, media_type: "tv" })));
        setTopRated(topRatedList.map((m: any) => ({ ...m, media_type: "movie" })));
        
        setConfigStatus(configStatusRes);

        // Combine and uniquely identify genre list
        const combined = [...(genresRes.movie || []), ...(genresRes.tv || [])];
        const unique = combined.filter((genre, index, self) =>
          self.findIndex((g) => g.id === genre.id) === index
        );
        setGenres(unique);
      } catch (err) {
        console.error("Failed to load catalog with Axios:", err);
      } finally {
        setIsLoading(false);
        setLoadingInitial(false);
      }
    };

    fetchMovieCatalog();
  }, []);

  // 3. Deep link handler for shared item links (?media=movie&id=123)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const mediaParam = queryParams.get("media");
    const idParam = queryParams.get("id");

    if (mediaParam && idParam) {
      const parsedId = parseInt(idParam, 10);
      if (!isNaN(parsedId)) {
        api.getDetails(mediaParam, parsedId)
          .then((aggregated) => {
            if (aggregated && aggregated.details) {
              const info = aggregated.details;
              setSelectedMedia({
                id: info.id,
                title: info.title,
                name: info.name,
                overview: info.overview,
                poster_path: info.poster_path,
                backdrop_path: info.backdrop_path,
                vote_average: info.vote_average,
                vote_count: 100,
                popularity: 100,
                media_type: mediaParam as "movie" | "tv",
              });
            }
          })
          .catch((err) => {
            console.error("Failed to load deep linked details:", err);
          });
      }
    }
  }, []);

  // Discover movies by genre
  useEffect(() => {
    if (selectedGenreId) {
      setLoadingGenreDiscover(true);
      const categoryType = activeTab === "tv" ? "tv" : "movie";
      api.getGenreDiscover(selectedGenreId, categoryType)
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
      api.search(searchQuery)
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playbackHistory.map((itemObj) => {
                      const record = itemObj.item;
                      const hasDetails = itemObj.season !== undefined && itemObj.episode !== undefined;
                      const backdrop = record.backdrop_path
                        ? `https://image.tmdb.org/t/p/w500${record.backdrop_path}`
                        : record.poster_path
                        ? `https://image.tmdb.org/t/p/w200${record.poster_path}`
                        : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=500";

                      const isHovered = hoveredHistoryId === record.id;
                      const isMiniPlaying = miniPlayerHistoryId === record.id;
                      const mediaType = record.media_type || (record.first_air_date ? "tv" : "movie");
                      
                      // Resolve Video Link for custom inline playing
                      const miniEmbedUrl = getEmbedUrl(
                        "videasy",
                        mediaType as "movie" | "tv",
                        record.id,
                        itemObj.season || 1,
                        itemObj.episode || 1
                      );

                      return (
                        <div
                          key={record.id}
                          className="relative flex flex-col bg-[#111111] border border-white/5 rounded-2xl overflow-hidden group transition-all duration-300 hover:border-red-650 hover:shadow-2xl hover:shadow-red-950/20"
                          onMouseEnter={() => setHoveredHistoryId(record.id)}
                          onMouseLeave={() => {
                            setHoveredHistoryId(null);
                            setMiniPlayerHistoryId(null);
                          }}
                        >
                          {/* Banner video element viewport */}
                          <div className="relative aspect-video w-full bg-[#050505] overflow-hidden">
                            {isMiniPlaying ? (
                              <iframe
                                src={miniEmbedUrl}
                                title={`Mini Playback - ${record.title || record.name}`}
                                className="w-full h-full border-none"
                                allowFullScreen
                                allow="autoplay; encrypted-media"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <>
                                <img
                                  src={backdrop}
                                  alt={record.title || record.name}
                                  className="h-full w-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-[1.03] transition-all duration-300"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />

                                {/* Custom hovering interactive trigger card overlay */}
                                <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  {/* Top Actions layout */}
                                  <div className="flex justify-between items-start">
                                    <span className="rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-black uppercase text-red-500 tracking-wider">
                                      {mediaType === "tv" ? "TV Series" : "Movie"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeHistoryItem(record.id);
                                      }}
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-red-650 border border-white/10 text-white/80 transition-all cursor-pointer"
                                      title="Delete Log Record"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  {/* Trigger overlay buttons in center */}
                                  <div className="flex justify-center items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => handlePlayMedia(record)}
                                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-red-500 hover:text-white transform scale-90 group-hover:scale-100 transition-all duration-200 shadow-xl cursor-pointer"
                                      title="Resume Fullscreen"
                                    >
                                      <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                                    </button>
                                  </div>

                                  {/* Hover indicator metadata at base */}
                                  <div className="text-[10px] text-white/50 bg-black/40 backdrop-blur-sm self-start px-2 py-0.5 rounded">
                                    Hovering Preview Active
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Metadata Description section */}
                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div className="space-y-1">
                              {/* Streemed temporal info */}
                              <p className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                <History className="h-3 w-3 text-red-500" />
                                <span>Streamed: {itemObj.watchedAt}</span>
                              </p>

                              <h3 className="text-sm font-bold text-white transition-colors group-hover:text-red-500 truncate filter drop-shadow">
                                {record.title || record.name}
                              </h3>

                              {hasDetails && (
                                <p className="text-[11px] font-extrabold text-red-500 flex items-center gap-1">
                                  <span>🚀 Last Played Segment:</span>
                                  <span className="rounded bg-red-600/10 border border-red-600/20 px-1.5 py-0.25 font-black">
                                    S{itemObj.season} &bull; EP{itemObj.episode}
                                  </span>
                                </p>
                              )}

                              <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
                                {record.overview || "This historical catalog entry lacks descriptive string parameters."}
                              </p>
                            </div>

                            {/* Base Control triggers of history action item */}
                            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2.5">
                              {isMiniPlaying ? (
                                <button
                                  type="button"
                                  onClick={() => setMiniPlayerHistoryId(null)}
                                  className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-black uppercase text-white hover:bg-white/10 transition-all"
                                >
                                  <span>Stop Quick Player</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setMiniPlayerHistoryId(record.id)}
                                  className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 text-xs font-black uppercase transition-all shadow-md"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Quick Resume</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handlePlayMedia(record)}
                                className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase text-white hover:bg-white/20 transition-all"
                                title="Open Full Screen Player"
                              >
                                <Play className="h-3 w-3 fill-current" />
                                <span className="hidden sm:inline">FULL</span>
                              </button>
                            </div>
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

      {/* --- FLOATING BACK TO TOP BUTTON --- */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-to-top"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-red-600 hover:bg-red-500 border border-white/10 text-white shadow-xl hover:shadow-red-600/25 transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Back to Top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- FLOATING SOCIAL LINKS --- */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3">
        {/* Discord Link */}
        <a
          href="https://discord.gg/5eWu9Vz6tQ"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#5865F2] hover:bg-[#4752C4] border border-white/10 text-white shadow-xl hover:shadow-[#5865F2]/25 transition-all duration-300 hover:scale-110 active:scale-95 group relative"
          aria-label="Join Discord"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
          </svg>
          {/* Tooltip */}
          <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap shadow-md">
            Discord
          </span>
        </a>

        {/* Telegram Link */}
        <a
          href="https://t.me/youplexannouncments"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#24A1DE] hover:bg-[#1E8BBF] border border-white/10 text-white shadow-xl hover:shadow-[#24A1DE]/25 transition-all duration-300 hover:scale-110 active:scale-95 group relative"
          aria-label="Join Telegram"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.556 8.16l-1.897 8.941c-.143.633-.519.79-.1.353-.023.011-.476-.328-.773-.553-.16-.12-.315-.228-.466-.312l-2.074-1.53c-.361-.341-.09-.524.08-.696.044-.045.92-.843 1.693-1.554.354-.326.709-.652 1.011-.937.108-.102.203-.193.284-.271.189-.18.324-.308.195-.494-.038-.055-.173-.02-.34.02-.132.031-1.428.887-3.904 2.553l-.228.151c-.636.42-1.229.626-1.78.614-.606-.013-1.77-.341-2.632-.62h-.002c-.687-.223-1.234-.341-1.187-.723l.006-.024c.036-.29.432-.587 1.187-.89l3.5-.13V5.5c4.618-2.008 7.7-3.336 9.246-3.984C18.157 1.22 19 1.05 19 1.5c0 .12-.03.41-.12.59l-.025.045-.299 1.488-.002.007-.998 4.53z"/>
          </svg>
          {/* Tooltip */}
          <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap shadow-md">
            Telegram
          </span>
        </a>
      </div>
    </div>
  );
}
