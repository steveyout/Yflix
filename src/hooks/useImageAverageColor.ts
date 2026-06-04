import { useState, useEffect } from "react";

const fallbacks = [
  "rgba(239, 68, 68, 0.45)",  // Soft Vibrancies: Red
  "rgba(168, 85, 247, 0.45)", // Purple
  "rgba(59, 130, 246, 0.45)", // Blue
  "rgba(244, 63, 94, 0.45)",  // Rose
  "rgba(245, 158, 11, 0.45)", // Amber
  "rgba(20, 184, 166, 0.45)", // Teal
  "rgba(16, 185, 129, 0.45)", // Emerald
  "rgba(99, 102, 241, 0.45)", // Indigo
];

function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % fallbacks.length;
  return fallbacks[idx];
}

export function useImageAverageColor(imageUrl: string | undefined, title: string): string {
  const [color, setColor] = useState<string>(() => getDeterministicColor(title));

  useEffect(() => {
    if (!imageUrl) {
      setColor(getDeterministicColor(title));
      return;
    }

    const defaultColor = getDeterministicColor(title);
    let active = true;

    const img = new Image();
    // Enable anonymous CORS to extract pixel metadata if served with headers
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      if (!active) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setColor(defaultColor);
          return;
        }
        ctx.drawImage(img, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const r = data[0];
        const g = data[1];
        const b = data[2];
        const a = data[3];

        if (a === 0) {
          setColor(defaultColor);
          return;
        }

        // Boost the vibrancy of the color to be highly aesthetic as an ambient glow
        const sum = r + g + b;
        if (sum < 90) {
          // Extremely dark/grayish image - mix in a standard vibrant fallback or override
          setColor(defaultColor);
          return;
        }

        // Apply a gentle scaling boost while capping at 255
        const scale = 1.35;
        const nr = Math.min(255, Math.round(r * scale));
        const ng = Math.min(255, Math.round(g * scale));
        const nb = Math.min(255, Math.round(b * scale));

        setColor(`rgba(${nr}, ${ng}, ${nb}, 0.42)`);
      } catch (err) {
        // Fall back to deterministic seed on security sandbox CORS block
        setColor(defaultColor);
      }
    };

    img.onerror = () => {
      if (active) {
        setColor(defaultColor);
      }
    };

    return () => {
      active = false;
    };
  }, [imageUrl, title]);

  return color;
}
