import React, { useEffect, useRef } from "react";

interface AdBannerProps {
  zoneKey: string;
  width: number;
  height: number;
}

export default function AdBanner({ zoneKey, width, height }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous script or iframe inside the container
    containerRef.current.innerHTML = "";

    // Create a raw script element representing the configuration script
    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.text = `
      atOptions = {
        'key' : '${zoneKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;

    // Create the script tag for invoke.js
    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = `https://directoryeditorweep.com/${zoneKey}/invoke.js`;

    // Append both to the container
    containerRef.current.appendChild(configScript);
    containerRef.current.appendChild(invokeScript);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [zoneKey, width, height]);

  return (
    <div className="flex flex-col items-center justify-center my-6 py-4 px-2 w-full overflow-hidden bg-[#0f0f0f]/30 border border-white/5 rounded-xl max-w-4xl mx-auto">
      <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2.5">
        Sponsored Advertisement
      </div>
      <div 
        ref={containerRef} 
        id-tag={`ad-${zoneKey}`}
        className="relative flex justify-center items-center overflow-auto max-w-full"
        style={{ minHeight: height }}
      />
    </div>
  );
}
