import React, { useState } from "react";
import { Star, Play, Plus, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovieOrTV } from "../types/movie";

interface MovieCardProps {
  key?: any;
  item: MovieOrTV;
  onPlay: (item: MovieOrTV) => void;
  onSelect: (item: MovieOrTV) => void;
  isBookmarked: boolean;
  toggleWatchlist: (item: MovieOrTV) => void;
}

export default function MovieCard({
  item,
  onPlay,
  onSelect,
  isBookmarked,
  toggleWatchlist,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Build the poster URL with support for fallbacks
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=500";

  const title = item.title || item.name || "Untitled Cinema";

  const releaseDate = item.release_date || item.first_air_date || "";
  const year = releaseDate ? releaseDate.split("-")[0] : "N/A";

  const rating = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
  const typeLabel = item.media_type === "tv" ? "Series" : "Movie";

  return (
    <motion.div
      className="relative flex-none w-[150px] sm:w-[170px] md:w-[190px] aspect-[2/3] select-none rounded-xl overflow-hidden bg-white/5 group border border-white/10 shadow-xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={() => onSelect(item)}
    >
      {/* Poster Image */}
      <img
        src={posterUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        referrerPolicy="no-referrer"
      />

      {/* Elegant Red Line Accent on hover */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content Badges (visible by default) */}
      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
        {/* Rating Bubble */}
        <span className="inline-flex items-center gap-0.5 rounded-md bg-black/85 px-1.5 py-0.5 text-[10px] font-black text-amber-500 backdrop-blur-md border border-white/10">
          <Star className="h-2.5 w-2.5 fill-current" />
          {rating}
        </span>
      </div>

      <div className="absolute top-2.5 right-2.5 z-10">
        {/* Media type bubble */}
        <span className="inline-flex rounded-md bg-red-600/90 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-white shadow">
          {typeLabel}
        </span>
      </div>

      {/* Slide overlay for hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-transparent p-3 flex flex-col justify-end gap-2"
          >
            {/* Overlay titles and facts */}
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">
                {year} &bull; {typeLabel}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
                {title}
              </h3>
            </div>

            {/* Quick Actions inside Overlay */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Play stream buttons */}
              <button
                type="button"
                onClick={() => onPlay(item)}
                title="Watch Now"
                className="flex items-center justify-center p-2 rounded-lg bg-red-600 text-white hover:bg-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_2px_8px_rgba(220,38,38,0.4)] cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>

              {/* Watchlist Bookmark toggle */}
              <button
                type="button"
                onClick={() => toggleWatchlist(item)}
                title={isBookmarked ? "Remove from watchlist" : "Add to watchlist"}
                className={`flex items-center justify-center p-2 rounded-lg border hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                  isBookmarked
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-black/60 text-white/70 hover:text-white hover:border-white/25"
                }`}
              >
                {isBookmarked ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>

              {/* View details */}
              <button
                type="button"
                onClick={() => onSelect(item)}
                title="View Details & More"
                className="flex items-center justify-center p-2 rounded-lg border border-white/10 bg-black/60 text-white/70 hover:text-white hover:border-white/25 hover:scale-105 active:scale-95 transition-all ml-auto cursor-pointer"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
