import React, { useState, useEffect } from "react";
import { Play, Plus, Check, Star, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovieOrTV } from "../types/movie";

interface HeroProps {
  items: MovieOrTV[];
  onPlay: (item: MovieOrTV) => void;
  onSelect: (item: MovieOrTV) => void;
  watchlistIds: number[];
  toggleWatchlist: (item: MovieOrTV) => void;
}

export default function Hero({ items, onPlay, onSelect, watchlistIds, toggleWatchlist }: HeroProps) {
  const [index, setIndex] = useState(0);

  // Auto cycle every 9 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) {
    return (
      <div className="relative h-[480px] w-full animate-pulse rounded-2xl bg-zinc-950 border border-zinc-900/50 flex items-center justify-center">
        <div className="text-zinc-600 font-medium">Flickering starry sky background...</div>
      </div>
    );
  }

  const currentItem = items[index];
  const isBookmarked = watchlistIds.includes(currentItem.id);

  const backdropUrl = currentItem.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`
    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1600";

  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const handlePrev = () => {
    setIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  // Human friendly year and text
  const mediaYear = currentItem.release_date 
    ? currentItem.release_date.split("-")[0]
    : currentItem.first_air_date
    ? currentItem.first_air_date.split("-")[0]
    : "N/A";

  const ratingPercentage = Math.round(currentItem.vote_average * 10);

  return (
    <div className="relative h-[560px] md:h-[620px] w-full overflow-hidden bg-black">
      {/* Background Image Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${backdropUrl})` }}
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>

      {/* Gradients Overlay: Deep Bottom fade, Black Left fade, Red Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-tr from-red-950/20 via-transparent to-transparent opacity-60" />

      {/* Content layout on top of gradient */}
      <div className="absolute inset-0 flex items-end px-4 py-8 sm:px-6 md:px-12 md:py-16">
        <div className="mx-auto w-full max-w-7xl relative">
          
          {/* TMDB Rating badge on high right inside container for desktop spacing constraint */}
          <div className="absolute right-0 bottom-40 hidden lg:flex flex-col space-y-4">
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center space-x-4 shadow-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center font-black text-xl text-white">
                {currentItem.vote_average.toFixed(1)}
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">TMDB Rating</div>
                <div className="text-xs font-bold text-white/95">{currentItem.vote_count || 328} Votes</div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -25, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl space-y-4"
            >
              {/* Featured on yflix & badge indicator */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-red-500 mb-1 tracking-widest uppercase">
                <span className="bg-red-500/10 px-2 py-1 rounded">Featured on yflix</span>
                <span className="text-white/40">•</span>
                <span className="text-white/60">Now Streaming</span>
              </div>

              {/* Title with magnificent display uppercase */}
              <h1 className="text-4xl font-black tracking-tighter text-white sm:text-5xl md:text-6xl text-shadow-lg leading-none uppercase">
                {currentItem.title || currentItem.name}
              </h1>

              {/* Rating match PG tags meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 font-medium pb-1.5">
                <span className="text-green-500 font-bold">{Math.max(88, Math.round(currentItem.vote_average * 10))}% Match</span>
                <span>{mediaYear}</span>
                <span className="px-1.5 py-0.5 border border-white/30 text-[10px] rounded uppercase font-black text-white/70">
                  {currentItem.media_type === "tv" ? "TV Show" : "PG-13"}
                </span>
                <span className="bg-white/15 px-2 py-0.5 rounded-sm text-xs font-semibold text-white/90">4K Ultra HD</span>
              </div>

              {/* Summary with beautiful line height and text opacity */}
              <p className="line-clamp-3 text-sm md:text-base leading-relaxed text-white/60 max-w-xl">
                {currentItem.overview || "No plot description available for this title."}
              </p>

              {/* Actions Section with exact button sizes and colors */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onPlay(currentItem)}
                  className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition duration-200 flex items-center space-x-2 text-sm cursor-pointer shadow-lg active:scale-95"
                >
                  <Play className="h-4.5 w-4.5 fill-current" />
                  <span>Play Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(currentItem)}
                  className="px-8 py-3 bg-white/10 backdrop-blur-md text-white font-bold rounded-lg border border-white/20 hover:bg-white/20 transition duration-200 flex items-center space-x-2 text-sm cursor-pointer active:scale-95"
                >
                  <Info className="h-4.5 w-4.5" />
                  <span>More Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWatchlist(currentItem)}
                  className={`px-5 py-3 rounded-lg border text-sm font-semibold transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95 ${
                    isBookmarked
                      ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {isBookmarked ? (
                    <>
                      <Check className="h-4.5 w-4.5" />
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4.5 w-4.5" />
                      <span>Watchlist</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Paddles */}
      <div className="absolute right-4 bottom-8 flex items-center gap-2 md:right-12 md:bottom-16">
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/70 text-zinc-400 hover:text-white transition-all backdrop-blur-sm hover:border-zinc-600 hover:scale-105 active:scale-95"
          aria-label="Previous backdrop slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/70 text-zinc-400 hover:text-white transition-all backdrop-blur-sm hover:border-zinc-600 hover:scale-105 active:scale-95"
          aria-label="Next backdrop slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute left-4 bottom-2 flex gap-1.5 md:left-12">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-red-600 shadow-[0_0_8px_#dc2626]" : "w-1.5 bg-zinc-800"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
