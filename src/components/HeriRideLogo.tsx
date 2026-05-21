import React from "react";

interface HeriRideLogoProps {
  className?: string;
  size?: number | string;
  showBackground?: boolean;
}

export function HeriRideLogo({ className = "", size = 120, showBackground = true }: HeriRideLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {showBackground && (
        <rect width="100" height="100" rx="24" fill="#FFC5D3" />
      )}
      <g
        stroke="#000000"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Rear Wheel */}
        <circle cx="30" cy="68" r="13" strokeWidth="3.6" />
        
        {/* Front Wheel */}
        <circle cx="70" cy="68" r="13" strokeWidth="3.6" />
        
        {/* Bicycle Frame */}
        {/* Rear Stay (drop-out to seat post) */}
        <line x1="30" y1="68" x2="46" y2="48" />
        
        {/* Chain Stay */}
        <line x1="30" y1="68" x2="52" y2="68" />
        
        {/* Seat Post / Tube */}
        <line x1="52" y1="68" x2="46" y2="48" />
        
        {/* Top/Down slanting frame lines */}
        <path d="M 46 48 L 61 48" />
        <path d="M 46 48 L 52 68" />
        <path d="M 52 68 L 63 52" />
        
        {/* Fork & Headtube & Handlebars */}
        <path d="M 70 68 L 63 48 L 61 40" />
        <path d="M 61 40 L 65 38" /> {/* Handlebars stem/grip */}
        
        {/* Seat / Saddle */}
        <line x1="41" y1="48" x2="49" y2="48" />
        
        {/* The Rider (Stick-figure girl with dress and ponytail) */}
        {/* Head */}
        <circle cx="49" cy="30" r="6.2" fill="none" strokeWidth="3.2" />
        
        {/* Ponytail (Curves backward and upward from the head) */}
        <path 
          d="M 44.5 27 C 38 21, 30 23, 27.5 31.5 C 31 35, 39.5 35.5 44 30.5" 
          strokeWidth="2.8"
        />
        
        {/* Torso/Dress */}
        {/* Back and front edges of the flared dress */}
        <path 
          d="M 49 36 L 56 55 C 50 56.5, 42 56.5, 39 55 Z" 
          fill="#FFC5D3" 
          strokeWidth="3.2" 
        />
        
        {/* Arm (reaching forward to handlebars) */}
        <path d="M 49 38 Q 55 42 61 46" />
        
        {/* Leg / Pedaling (from under dress to pedal) */}
        <path d="M 47.5 55 Q 50 63 48.5 68" />
      </g>
    </svg>
  );
}
