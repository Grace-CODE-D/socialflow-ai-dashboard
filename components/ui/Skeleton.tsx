import React from 'react';

export const ImageSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`}>
    <div className="w-full h-full bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse p-4 rounded-2xl bg-dark-surface border border-dark-border">
    <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
    <div className="h-3 bg-white/5 rounded w-1/2" />
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-dark-surface border border-dark-border animate-pulse">
        <div className="w-12 h-12 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-1/3" />
          <div className="h-2 bg-white/5 rounded w-1/4" />
        </div>
      </div>
    ))}
  </>
);
