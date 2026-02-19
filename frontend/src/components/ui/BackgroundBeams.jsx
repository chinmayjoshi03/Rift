import React from 'react';

export const BackgroundBeams = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue/20 to-transparent animate-pulse" />
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-pulse delay-1000" />
      <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-green/20 to-transparent animate-pulse delay-2000" />
    </div>
  );
};
