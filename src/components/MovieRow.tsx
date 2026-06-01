import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import { MovieOrTV } from "../types/movie";

interface MovieRowProps {
  title: string;
  items: MovieOrTV[];
  onPlay: (item: MovieOrTV) => void;
  onSelect: (item: MovieOrTV) => void;
  watchlistIds: number[];
  toggleWatchlist: (item: MovieOrTV) => void;
}

export default function MovieRow({
  title,
  items,
  onPlay,
  onSelect,
  watchlistIds,
  toggleWatchlist,
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      rowRef.current.scrollTo({
        left: scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative space-y-3 px-4 sm:px-6 md:px-12 py-4">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Crimson aesthetic bullet Indicator */}
          <div className="h-5 w-1 rounded-full bg-red-600 shadow-[0_0_8px_#dc2626]" />
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase sm:text-lg">
            {title}
          </h2>
        </div>

        {/* Rows Desktop Paddles (only displays when items are lengthy) */}
        {items.length > 4 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 cursor-pointer shadow transition-all duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 cursor-pointer shadow transition-all duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Flex Container */}
      <div className="relative group">
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <MovieCard
              key={item.id}
              item={item}
              onPlay={onPlay}
              onSelect={onSelect}
              isBookmarked={watchlistIds.includes(item.id)}
              toggleWatchlist={toggleWatchlist}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
