import React, { useState, useEffect } from "react";
import { X, Play, Plus, Check, Star, Clock, Calendar, Film, Bookmark, Users, Sparkles, Youtube } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovieOrTV, DetailsAggregated, MovieDetail, CastMember } from "../types/movie";
import AdBanner from "./AdBanner";
import { SkeletonDetail } from "./Skeletons";
import api from "../api";

interface DetailModalProps {
  item: MovieOrTV;
  onClose: () => void;
  onPlay: (item: MovieOrTV, seasons?: any[]) => void;
  watchlistIds: number[];
  toggleWatchlist: (item: MovieOrTV) => void;
}

export default function DetailModal({
  item,
  onClose,
  onPlay,
  watchlistIds,
  toggleWatchlist,
}: DetailModalProps) {
  const [data, setData] = useState<DetailsAggregated | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MovieOrTV>(item);

  // Re-fetch when selected item changes (e.g. from recommendations)
  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    const mediaType = selectedItem.media_type || (selectedItem.first_air_date ? "tv" : "movie");

    api.getDetails(mediaType, selectedItem.id)
      .then((aggregated: DetailsAggregated) => {
        setData(aggregated);
      })
      .catch((err: any) => {
        console.error("Failed to load details summary:", err);
        setError(err.message || "Failed to load movie details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedItem]);

  const handleRecommendationClick = (newItem: MovieOrTV) => {
    // If media type is missing, infer it from property indicators
    const inferredType = newItem.media_type || (newItem.first_air_date ? "tv" : "movie");
    setSelectedItem({ ...newItem, media_type: inferredType });
  };

  const isBookmarked = watchlistIds.includes(selectedItem.id);
  const mediaType = selectedItem.media_type || (selectedItem.first_air_date ? "tv" : "movie");

  // Filter YouTube trailers
  const trailerVideo = data?.videos.results.find(
    (v) => (v.site?.toLowerCase() === "youtube") && (v.type?.toLowerCase() === "trailer" || v.type?.toLowerCase() === "teaser")
  );

  const backdropUrl = selectedItem.backdrop_path
    ? `https://image.tmdb.org/t/p/original${selectedItem.backdrop_path}`
    : selectedItem.poster_path
    ? `https://image.tmdb.org/t/p/original${selectedItem.poster_path}`
    : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=1200";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      
      {/* Outer Dimmer Close Button */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 350, damping: 30 }}
        className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0a0a0a] text-white overflow-hidden shadow-2xl z-10 select-none pb-8 max-h-[92vh] flex flex-col"
      >
        {/* Detail Body */}
        {loading ? (
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-25 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 border border-white/10 text-white/50 hover:text-white hover:scale-105 transition-all cursor-pointer shadow-md"
              aria-label="Close details overlay"
            >
              <X className="h-5 w-5" />
            </button>
            <SkeletonDetail />
          </>
        ) : error ? (
          <div className="h-[400px] w-full flex flex-col items-center justify-center p-6 text-center gap-3">
            <h3 className="text-lg font-black text-red-500">Service Unreachable</h3>
            <p className="text-zinc-500 text-xs max-w-md">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white"
            >
              Close Overlay
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {/* Header backdrop area */}
            <div className="relative h-[220px] sm:h-[300px] md:h-[320px] w-full">
              {/* Background Backdrop image */}
              <img
                src={backdropUrl}
                alt={selectedItem.title || selectedItem.name}
                className="absolute inset-0 h-full w-full object-cover opacity-35"
                referrerPolicy="no-referrer"
              />
              {/* Bottom fading block */}
              <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

              {/* Close Button top-right over backdrop */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-25 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white/50 hover:text-white hover:scale-105 transition-all cursor-pointer shadow-md"
                aria-label="Close details overlay"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Top Title, taglines etc. absolute over graphic */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-red-600/30 border border-red-500/35 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-tight">
                    {mediaType === "tv" ? "TV Series" : "Movie"}
                  </span>
                  {data?.details.status && (
                    <span className="rounded bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      {data.details.status}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  {selectedItem.title || selectedItem.name}
                </h2>

                {data?.details.tagline && (
                  <p className="text-xs sm:text-sm text-red-400/95 italic font-medium">
                    "{data.details.tagline}"
                  </p>
                )}
              </div>
            </div>

            {/* Main Content Layout */}
            <div className="px-4 sm:px-6 space-y-6 pt-3">
              {/* Primary info details banner */}
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Meta details column */}
                <div className="flex-1 space-y-4">
                  {/* Row tags */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-zinc-400">
                    {/* Stars count */}
                    <span className="flex items-center gap-1.5 font-bold text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      {selectedItem.vote_average.toFixed(1)} / 10
                    </span>

                    {/* Runtime */}
                    {(data?.details.runtime || (data?.details.episode_run_time && data?.details.episode_run_time.length > 0)) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        {data.details.runtime 
                          ? `${data.details.runtime} mins`
                          : `${data.details.episode_run_time?.[0]} mins per ep`}
                      </span>
                    )}

                    {/* Cal Release Date */}
                    {(selectedItem.release_date || selectedItem.first_air_date) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        {selectedItem.release_date || selectedItem.first_air_date}
                      </span>
                    )}

                    {/* TV metadata (seasons count) */}
                    {mediaType === "tv" && data?.details.number_of_seasons && (
                      <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/70">
                        {data.details.number_of_seasons} Seasons &bull; {data.details.number_of_episodes} Episodes
                      </span>
                    )}
                  </div>

                  {/* Overview Text */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase text-white/40 tracking-wide">Overview Summary</h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {selectedItem.overview || "This specific cinematic work lacks a comprehensive overview database file."}
                    </p>
                  </div>

                  {/* Genres Pills */}
                  {data?.details.genres && data.details.genres.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {data.details.genres.map((g) => (
                        <span key={g.id} className="rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-medium py-1 px-2.5">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onPlay(selectedItem, data?.details.seasons)}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-black px-6 py-2.5 text-xs font-bold transition-all hover:bg-white/90"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>Start Streaming</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWatchlist(selectedItem)}
                      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-semibold transition-all ${
                        isBookmarked
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {isBookmarked ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Watchlist Active</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Add Watchlist</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right side poster display (hidden on phone screen) */}
                {selectedItem.poster_path && (
                  <div className="hidden sm:block w-36 aspect-[2/3] select-none rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-lg">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${selectedItem.poster_path}`}
                      alt={selectedItem.title || selectedItem.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Cast Row Section */}
              {data?.credits.cast && data.credits.cast.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <h3 className="text-xs font-black uppercase tracking-wide text-zinc-500">Primary Cast & Actors</h3>
                  </div>

                  <div className="flex gap-3.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                    {data.credits.cast.slice(0, 12).map((actor) => {
                      const picUrl = actor.profile_path
                        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=185";

                      return (
                        <div key={actor.id} className="flex-none w-20 text-center space-y-1.5">
                          <div className="h-20 w-20 rounded-full border border-white/15 overflow-hidden bg-cover bg-center bg-white/5">
                            <img
                              src={picUrl}
                              alt={actor.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-white leading-tight truncate">{actor.name}</p>
                            <p className="text-[9px] text-zinc-500 leading-normal truncate">{actor.character}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* YouTube Trailer container */}
              {trailerVideo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <h3 className="text-xs font-black uppercase tracking-wide text-zinc-500">Official Cinematic Promo</h3>
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailerVideo.key}`}
                      title={`${selectedItem.title || selectedItem.name} Promos`}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Sponsored Banner Unit */}
              <div className="py-2 border-t border-b border-white/5 my-4">
                <AdBanner zoneKey="bd4d005dde28625fed7ac1ccb523a36a" width={300} height={250} />
              </div>

              {/* Recommendations Section */}
              {data?.recommendations.results && data.recommendations.results.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-red-500" />
                    <h3 className="text-xs font-black uppercase tracking-wide text-zinc-500">Related Recommendations</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {data.recommendations.results.slice(0, 4).map((rec) => {
                      const poster = rec.poster_path
                        ? `https://image.tmdb.org/t/p/w300${rec.poster_path}`
                        : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=300";
                      
                      const recTitle = rec.title || rec.name || "Cinema Rec";
                      const rating = rec.vote_average ? rec.vote_average.toFixed(1) : "0.0";

                      return (
                        <div
                          key={rec.id}
                          onClick={() => handleRecommendationClick(rec)}
                          className="relative flex-none rounded-lg overflow-hidden aspect-[2/3] border border-white/10 bg-white/5 group cursor-pointer hover:border-red-600 transition-all"
                        >
                          <img
                            src={poster}
                            alt={recTitle}
                            className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-2.5 gap-0.5">
                            <span className="text-[8px] bg-red-600 px-1 rounded text-white font-bold w-max self-start tracking-wide">
                              RECOMMENDED
                            </span>
                            <span className="text-[10px] text-white font-bold line-clamp-1 leading-snug">{recTitle}</span>
                            <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              {rating}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
