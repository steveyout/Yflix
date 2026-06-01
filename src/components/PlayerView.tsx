import React, { useState, useEffect } from "react";
import { Play, Tv, ArrowLeft, Layers, Film, Sparkles, MonitorPlay } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { providers, getEmbedUrl, DEFAULT_PROVIDER_ID } from "../config/providers";
import { MovieDetail, Episode, Season } from "../types/movie";

interface PlayerViewProps {
  mediaType: "movie" | "tv";
  mediaId: number;
  title: string;
  backdropPath: string | null;
  tagline?: string | null;
  seasons?: Season[];
  onBack: () => void;
  onLoggedWatchedEpisode?: (season: number, episode: number) => void;
}

export default function PlayerView({
  mediaType,
  mediaId,
  title,
  backdropPath,
  tagline,
  seasons = [],
  onBack,
  onLoggedWatchedEpisode,
}: PlayerViewProps) {
  const [selectedProviderId, setSelectedProviderId] = useState(DEFAULT_PROVIDER_ID);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodesError, setEpisodesError] = useState<string | null>(null);

  // TV Series Logic: Fetch episodes when season or show changes
  useEffect(() => {
    if (mediaType === "tv") {
      setLoadingEpisodes(true);
      setEpisodesError(null);
      fetch(`/api/movies/tv/${mediaId}/season/${currentSeason}`)
        .then((res) => {
          if (!res.ok) throw new Error("Could not load episodes for this season.");
          return res.json();
        })
        .then((data) => {
          setEpisodes(data.episodes || []);
        })
        .catch((err: any) => {
          console.error("TV episodes loading error:", err);
          setEpisodesError(err.message || "Failed to fetch episodes list");
        })
        .finally(() => {
          setLoadingEpisodes(false);
        });
    }
  }, [mediaId, mediaType, currentSeason]);

  // Log watching behavior
  useEffect(() => {
    if (onLoggedWatchedEpisode && mediaType === "tv") {
      onLoggedWatchedEpisode(currentSeason, currentEpisode);
    }
  }, [currentSeason, currentEpisode, mediaType, onLoggedWatchedEpisode]);

  const activeEmbedUrl = getEmbedUrl(
    selectedProviderId,
    mediaType,
    mediaId,
    currentSeason,
    currentEpisode
  );

  // Filter out disabled providers
  const activeProviders = providers.filter((p) => p.enabled);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Bar controls */}
      <div className="w-full bg-[#0f0f0f]/95 border-b border-white/5 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-1 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Catalog</span>
          </button>
          
          <div className="truncate">
            <h2 className="text-sm md:text-base font-black truncate text-white">
              {title}
            </h2>
            {mediaType === "tv" && (
              <span className="text-[10px] text-red-500 font-bold tracking-tight uppercase">
                Playing: Season {currentSeason}, Episode {currentEpisode}
              </span>
            )}
            {mediaType === "movie" && (
              <span className="text-[10px] text-white/40 font-medium tracking-normal">
                Full-Length Cinematic Stream
              </span>
            )}
          </div>
        </div>

        {/* Server Switcher Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="hidden sm:inline text-xs text-white/50 font-medium">Server:</label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 py-1.5 px-3 text-xs text-white/80 outline-none focus:border-red-600 cursor-pointer"
          >
            {activeProviders.map((prov) => (
              <option key={prov.id} value={prov.id} className="bg-[#0f0f0f] text-white/80">
                {prov.name}
              </option>
            ))}
          </select>

          {/* Theater Toggle */}
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`hidden md:inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isTheaterMode
                ? "border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                : "border-white/10 bg-white/5 text-white/80 hover:text-white hover:border-white/20"
            }`}
            title="Expand screen layout for optimal desktop streaming"
          >
            <Layers className="h-4 w-4" />
            <span>{isTheaterMode ? "Normal Mode" : "Theater Mode"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className={`flex flex-col lg:flex-row flex-1 overflow-hidden ${
        isTheaterMode ? "max-w-full" : "max-w-7xl mx-auto w-full"
      }`}>
        
        {/* Left Side: Video Frame Portal */}
        <div className="flex-1 bg-zinc-950 flex flex-col justify-center relative min-h-[300px] sm:min-h-[420px] md:min-h-[500px]">
          {activeEmbedUrl ? (
            <div className="relative w-full aspect-video md:flex-1">
              <iframe
                src={activeEmbedUrl}
                title={`Streaming Portal: ${title}`}
                className="absolute inset-0 w-full h-full border-0 bg-black shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-zinc-950/80">
              <MonitorPlay className="h-12 w-12 text-zinc-600 animate-pulse" />
              <p className="text-zinc-500 text-sm font-semibold">Readying the cinema beam...</p>
            </div>
          )}

          {/* Prompt warning about redirections */}
          <div className="bg-[#0a0a0a] border-t border-white/5 p-3 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-[10px] text-white/40 max-w-lg leading-snug">
              Streaming servers are hosted by external third parties. They may serve temporary promotional ad-overlays. We highly recommend using an ad-blocker for a pristine cinematic experience.
            </span>
          </div>
        </div>

        {/* Right Side / Bottom: Episodes & Details Drawer for TV series */}
        {mediaType === "tv" && (
          <div className="w-full lg:w-[350px] bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-[520px] lg:h-auto overflow-hidden">
            {/* Season Selector Title */}
            <div className="p-4 border-b border-white/5 bg-[#0a0a0a]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-red-500" />
                <span className="text-xs font-black uppercase text-white/80">Episode Listing</span>
              </div>

              {seasons && seasons.length > 0 && (
                <select
                  value={currentSeason}
                  onChange={(e) => {
                    setCurrentSeason(Number(e.target.value));
                    setCurrentEpisode(1);
                  }}
                  className="rounded-lg bg-[#0a0a0a] border border-white/10 py-1 px-2.5 text-xs font-semibold text-white focus:border-red-600 outline-none cursor-pointer"
                >
                  {seasons
                    .filter((s) => s.season_number > 0) // Skip specials
                    .map((s) => (
                      <option key={s.id} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Episodes List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-2 space-y-1.5">
              {loadingEpisodes ? (
                <div className="space-y-3 p-2 animate-pulse">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="w-full flex gap-3 p-2.5 border border-white/5 bg-zinc-950/40 rounded-xl">
                      {/* Thumbnail Placeholder */}
                      <div className="w-24 aspect-video bg-zinc-900 flex-shrink-0 rounded-lg" />
                      {/* Info lines Placeholder */}
                      <div className="flex-1 space-y-2 py-0.5">
                        <div className="h-3 w-3/4 bg-zinc-800 rounded" />
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-zinc-900 rounded" />
                          <div className="h-2 w-11/12 bg-zinc-900 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : episodesError ? (
                <div className="p-4 text-center text-red-400 text-xs py-8">
                  {episodesError}
                </div>
              ) : episodes.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs py-8">
                  No episodes found.
                </div>
              ) : (
                episodes.map((ep) => {
                  const isActive = ep.episode_number === currentEpisode;
                  const stillUrl = ep.still_path
                    ? `https://image.tmdb.org/t/p/w200${ep.still_path}`
                    : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=200";

                    return (
                      <button
                        key={ep.id}
                        onClick={() => setCurrentEpisode(ep.episode_number)}
                        className={`w-full flex gap-3 text-left p-2.5 rounded-xl transition-all border ${
                          isActive
                            ? "bg-red-950/20 border-red-900 text-white"
                            : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {/* Episode Thumbnail */}
                        <div className="relative w-24 aspect-video bg-[#0a0a0a] rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={stillUrl}
                          alt={ep.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex items-center justify-center">
                            <Play className="h-4 w-4 text-white fill-current animate-pulse" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold text-zinc-400">
                          EP {ep.episode_number}
                        </span>
                      </div>

                      {/* Episode Information */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-xs font-bold leading-snug line-clamp-1">
                          {ep.name || `Episode ${ep.episode_number}`}
                        </h4>
                        <p className="text-[10px] text-zinc-500 line-clamp-2 md:line-clamp-3 leading-relaxed">
                          {ep.overview || "No scene synopsis compiled for this television broadcast."}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
