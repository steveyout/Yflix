import React, { useState } from "react";
import { Search, Film, Tv, Library, History, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  activeTab: "home" | "movie" | "tv" | "watchlist" | "history";
  setActiveTab: (tab: "home" | "movie" | "tv" | "watchlist" | "history") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  configStatus: { configured: boolean; baseUrl: string } | null;
  onRefresh: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  configStatus,
  onRefresh,
}: HeaderProps) {
  const [isFocused, setIsFocused] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Film },
    { id: "movie", label: "Movies", icon: Film },
    { id: "tv", label: "TV Shows", icon: Tv },
    { id: "watchlist", label: "My Watchlist", icon: Library },
    { id: "history", label: "History", icon: History },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0f0f0f]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => { setActiveTab("home"); setSearchQuery(""); }} 
            className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-red-700 to-red-500 rounded-lg flex items-center justify-center font-black text-xl tracking-tighter text-white">
              Y
            </div>
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
              yflix
            </span>
          </button>
        </div>

        {/* Navigation - Wide Screens */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !searchQuery;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setActiveTab(item.id); setSearchQuery(""); }}
                className={`relative flex items-center gap-2 py-5 text-sm font-medium tracking-wide transition-colors duration-200 cursor-pointer ${
                  isActive 
                    ? "text-white font-bold" 
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 text-red-500/80" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side search & status bar */}
        <div className="flex items-center gap-3 w-full max-w-[280px] sm:max-w-xs md:max-w-sm">
          {/* Search container */}
          <div className="relative w-full">
            <div className={`relative flex items-center bg-white/5 rounded-full px-4 py-2 border transition-all ${
              isFocused 
                ? "border-red-600 ring-1 ring-red-600/30" 
                : "border-white/10 hover:border-white/20"
            }`}>
              <Search className="h-4 w-4 text-white/40 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search TMDB Database..."
                className="w-full bg-transparent border-none text-xs text-white/80 focus:outline-none placeholder:text-white/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/20"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Config Alert Indicator */}
          {configStatus && !configStatus.configured && (
            <div 
              title="TMDB API Access Key is missing or invalid. Please setup TMDB_ACCESS_TOKEN."
              className="flex items-center cursor-help rounded-full bg-amber-500/10 p-2 text-amber-500 border border-amber-500/20"
            >
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Touch Mobile Layout */}
      <div className="flex md:hidden w-full border-t border-zinc-950 bg-black/90 px-2 py-1 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !searchQuery;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveTab(item.id); setSearchQuery(""); }}
              className={`flex flex-col items-center gap-0.5 rounded-md py-1 px-3 text-[10px] font-bold transition-colors ${
                isActive ? "text-red-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
