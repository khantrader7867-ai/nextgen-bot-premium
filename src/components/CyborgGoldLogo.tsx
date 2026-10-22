import React, { useState } from 'react';

interface CyborgGoldLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const CyborgGoldLogo: React.FC<CyborgGoldLogoProps> = ({
  size = 'md',
  className = '',
  glow = true,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 32,
    xl: 44,
  }[size];

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden bg-slate-950 border border-amber-400/40 ${sizeClasses} ${
        glow ? 'shadow-[0_0_15px_rgba(245,158,11,0.35)]' : ''
      } transition-transform duration-300 hover:scale-105 ${className}`}
    >
      {!hasError ? (
        <img
          src="/src/assets/images/cyber_cyborg_gold_logo_1792593069481.jpg"
          alt="NextGen AI Cyborg Logo"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover select-none"
        />
      ) : (
        /* Resilient High-Tech Golden Cyborg SVG Fallback */
        <svg
          width={iconSizes}
          height={iconSizes}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-amber-400"
        >
          {/* Outer Ring & Circuitry */}
          <circle cx="24" cy="24" r="22" stroke="url(#goldGrad)" strokeWidth="2" strokeDasharray="6 3" />
          <circle cx="24" cy="24" r="18" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" />
          {/* Cyborg Head Silhouette */}
          <path
            d="M24 10C17 10 13 14 13 21C13 27 16 33 21 37L24 39L27 37C32 33 35 27 35 21C35 14 31 10 24 10Z"
            fill="#090d16"
            stroke="url(#goldGrad)"
            strokeWidth="1.6"
          />
          {/* Luminous Cyborg Visor / Eyes */}
          <ellipse cx="19" cy="22" rx="3.5" ry="2" fill="#ffffff" />
          <ellipse cx="29" cy="22" rx="3.5" ry="2" fill="#ffffff" />
          <circle cx="19" cy="22" r="1.5" fill="#f59e0b" />
          <circle cx="29" cy="22" r="1.5" fill="#f59e0b" />
          {/* Forehead Microchip Core */}
          <rect x="22" y="13" width="4" height="4" rx="1" fill="#f59e0b" />
          <line x1="24" y1="17" x2="24" y2="21" stroke="#fbbf24" strokeWidth="1.2" />
          {/* Jaw / Chini Armor */}
          <path d="M20 32H28L26 35H22L20 32Z" fill="#f59e0b" fillOpacity="0.8" />
          <defs>
            <linearGradient id="goldGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
      )}
      {/* Subtle Shimmer Overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] ring-1 ring-inset ring-amber-300/20" />
    </div>
  );
};
