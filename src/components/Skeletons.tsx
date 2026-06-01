import React from "react";

export function SkeletonCard() {
  return (
    <div className="relative flex-none w-[150px] sm:w-[170px] md:w-[190px] aspect-[2/3] rounded-xl bg-zinc-900/60 border border-white/5 overflow-hidden animate-pulse">
      {/* Simulation of top rating or media type badges */}
      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
        <div className="h-5 w-10 rounded-md bg-zinc-800" />
      </div>
      <div className="absolute top-2.5 right-2.5 z-10">
        <div className="h-5 w-12 rounded-md bg-zinc-800" />
      </div>

      {/* Slide overlay simulation with gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-3 gap-2">
        <div className="space-y-1.5 pb-1">
          {/* Release year & category placeholders */}
          <div className="h-2.5 w-1/2 rounded bg-zinc-800" />
          {/* Main Title placeholder */}
          <div className="h-3.5 w-4/5 rounded bg-zinc-800/80" />
          <div className="h-3 w-3/5 rounded bg-zinc-800/60" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow({ title }: { title: string }) {
  return (
    <div className="relative space-y-3 px-4 sm:px-6 md:px-12 py-4">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Crimson aesthetic bullet Indicator */}
          <div className="h-5 w-1 rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-6 w-36 sm:w-48 bg-zinc-900 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Horizontal Flex Container containing skeleton cards */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-hidden pb-4 pt-1 px-1">
          {Array.from({ length: 7 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx}
          className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5 bg-zinc-900/60 flex flex-col justify-end p-3 gap-2"
        >
          {/* Badges placeholders */}
          <div className="absolute top-2.5 left-2.5 h-4 w-8 rounded bg-zinc-800" />
          <div className="absolute top-2.5 right-2.5 h-4 w-10 rounded bg-zinc-800" />
          
          <div className="space-y-1.5 pb-1">
            <div className="h-3.5 w-11/12 rounded bg-zinc-800" />
            <div className="h-2.5 w-1/2 rounded bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative w-full h-[380px] sm:h-[480px] md:h-[580px] lg:h-[650px] bg-zinc-950 border-b border-white/5 overflow-hidden animate-pulse flex flex-col justify-end">
      {/* Background overlay simulation */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-transparent to-transparent" />

      {/* Hero content details skeleton */}
      <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 md:px-12 pb-12 sm:pb-20 space-y-4">
        {/* Genre highlight ticker */}
        <div className="h-3.5 w-24 bg-zinc-800 rounded" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-8 sm:h-12 w-2/3 sm:w-1/2 bg-zinc-900 rounded-lg" />
          <div className="h-8 w-1/3 bg-zinc-900 rounded-lg hidden sm:block" />
        </div>

        {/* Overview paragraph line simulators */}
        <div className="space-y-2 max-w-2xl pt-2">
          <div className="h-3 w-full bg-zinc-900 rounded" />
          <div className="h-3 w-11/12 bg-zinc-900 rounded" />
          <div className="h-3 w-3/4 bg-zinc-900 rounded" />
        </div>

        {/* Buttons placeholders */}
        <div className="flex flex-wrap gap-3 pt-4">
          <div className="h-10 w-28 sm:w-36 bg-zinc-800 rounded-xl" />
          <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
          <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="w-full flex-1 overflow-y-auto animate-pulse flex flex-col">
      {/* Detail backdrop simulator */}
      <div className="relative h-[220px] sm:h-[300px] w-full bg-zinc-950 flex flex-col justify-end p-6 border-b border-white/5 pb-8">
        <div className="space-y-3 max-w-lg">
          <div className="h-4 w-20 bg-zinc-800 rounded" />
          <div className="h-8 w-3/4 sm:w-1/2 bg-zinc-900 rounded-lg" />
          <div className="h-3.5 w-2/3 bg-zinc-900 rounded" />
        </div>
      </div>

      {/* Grid structure details */}
      <div className="p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Play Actions & Stats simulator */}
            <div className="flex flex-wrap gap-3">
              <div className="h-10 w-32 bg-zinc-900 rounded-xl" />
              <div className="h-10 w-32 bg-zinc-900 rounded-xl" />
            </div>

            {/* Overview text */}
            <div className="space-y-2.5">
              <div className="h-4 w-28 bg-zinc-800 rounded" />
              <div className="h-3 w-full bg-zinc-900 rounded" />
              <div className="h-3 w-11/12 bg-zinc-900 rounded" />
              <div className="h-3 w-4/5 bg-zinc-900 rounded" />
            </div>

            {/* Cast section simulator */}
            <div className="space-y-4 pt-4">
              <div className="h-4 w-32 bg-zinc-800 rounded" />
              <div className="flex gap-4 overflow-x-hidden pt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-none text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 mx-auto" />
                    <div className="h-2.5 w-16 bg-zinc-900 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar parameters simulator */}
          <div className="space-y-4 rounded-xl border border-white/5 bg-zinc-950/45 p-5">
            <div className="h-4 w-24 bg-zinc-800 rounded" />
            <div className="space-y-3.5 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-16 bg-zinc-900 rounded" />
                  <div className="h-3 w-20 bg-zinc-900 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

