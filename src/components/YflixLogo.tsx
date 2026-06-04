import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function YflixLogo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg
      className={`${className} select-none`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background Gradient */}
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5252" />
          <stop offset="60%" stopColor="#d30f0f" />
          <stop offset="100%" stopColor="#800202" />
        </linearGradient>

        {/* Outer shadow */}
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#ff0000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main Squircle Background with Drop Shadow */}
      <rect
        x="0"
        y="0"
        width="200"
        height="200"
        rx="54"
        fill="url(#bgGrad)"
        filter="url(#logoShadow)"
      />

      {/* Styled Inner Overlay/Shedding mimicking the curved fold from user design */}
      <path
        d="M 54,0 C 120,0 200,60 200,130 C 200,175 165,200 120,200 C 50,200 0,130 0,60 C 0,25 25,0 54,0 Z"
        fill="#000000"
        opacity="0.15"
      />
      <path
        d="M 54,0 C 130,10 200,80 200,140 C 200,190 140,200 80,200 C 20,180 0,110 0,60 C 0,10 20,0 54,0 Z"
        fill="#ff0000"
        opacity="0.1"
      />

      {/* High precision white play icon */}
      <path
        d="M 78,56
           C 78,51.5 83,48.5 87,51 
           L 151,89 
           C 155,91.5 155,97.5 151,100 
           L 87,138 
           C 83,140.5 78,137.5 78,133 
           Z"
        fill="#ffffff"
      />

      {/* Delicate inner border accent */}
      <rect
        x="2.5"
        y="2.5"
        width="195"
        height="195"
        rx="51.5"
        stroke="#ffffff"
        strokeOpacity="0.12"
        strokeWidth="5"
      />
    </svg>
  );
}
