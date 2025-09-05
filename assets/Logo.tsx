
import React from 'react';

const Logo: React.FC<{ className?: string, primaryColor?: string }> = ({ className, primaryColor = "#52b788" }) => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="translate(50,50)">
      {/* Mosque Dome */}
      <path d="M0 -40 A40 40 0 0 1 0 -40 Z" fill={primaryColor} />
      <path d="M-35 -10 A40 30 0 0 1 35 -10 L25 20 L-25 20 Z" fill={primaryColor} />
      
      {/* Minaret-like structures */}
      <rect x="-45" y="-10" width="10" height="40" fill={primaryColor} rx="3" />
      <rect x="35" y="-10" width="10" height="40" fill={primaryColor} rx="3" />
      <circle cx="-40" cy="-15" r="5" fill="#FFFFFF" />
      <circle cx="40" cy="-15" r="5" fill="#FFFFFF" />

      {/* Crescent (simple) */}
      <path d="M5 -38 A15 15 0 1 0 5 -38 Z" fill="#FFFFFF" transform="rotate(-20)" />
       <path d="M10 -38 A12 12 0 1 0 10 -38 Z" fill={primaryColor} transform="rotate(-20) translate(3,0)" />

      {/* Book Icon / Base */}
      <path d="M-30 25 L30 25 L35 35 L-35 35 Z" fill="#3E8E7E" />
      <path d="M-25 28 L25 28 L25 32 L-25 32 Z" fill="#FFFFFF" />
    </g>
  </svg>


);

export default Logo;
