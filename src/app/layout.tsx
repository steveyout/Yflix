import type { Metadata } from "next";
import React from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../index.css";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://movy.live"),
  title: "Movy | Watch Free Movies and TV Shows Online",
  description: "Movy offers free access to the latest movies and TV shows in high quality. Enjoy a vast library of entertainment with instant streaming.",
  keywords: ["movy", "movy.live", "free movies", "watch tv shows online", "streaming site", "high quality movies", "entertainment"],
  alternates: {
    canonical: "https://movy.live",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Movy | Watch Free Movies and TV Shows Online",
    description: "Movy offers free access to the latest movies and TV shows in high quality. Enjoy a vast library of entertainment with instant streaming.",
    url: "https://movy.live",
    siteName: "Movy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movy | Watch Free Movies and TV Shows Online",
    description: "Movy offers free access to the latest movies and TV shows in high quality. Enjoy a vast library of entertainment with instant streaming.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Suppress and swallow fetch-reassignment errors globally before other scripts load
                window.addEventListener("error", function(event) {
                  if (event && event.message) {
                    var msg = event.message.toLowerCase();
                    if (msg.indexOf("cannot set property fetch") !== -1 || 
                        msg.indexOf("only a getter") !== -1 || 
                        msg.indexOf("property fetch of") !== -1) {
                      console.warn("[Muted Early Sandbox Error]:", event.message);
                      if (event.preventDefault) event.preventDefault();
                      if (event.stopPropagation) event.stopPropagation();
                      return true;
                    }
                  }
                }, true);

                window.addEventListener("unhandledrejection", function(event) {
                  if (event && event.reason) {
                    var msg = (event.reason.message || String(event.reason)).toLowerCase();
                    if (msg.indexOf("cannot set property fetch") !== -1 || 
                        msg.indexOf("only a getter") !== -1 || 
                        msg.indexOf("property fetch of") !== -1) {
                      console.warn("[Muted Early Sandbox Rejection]:", msg);
                      if (event.preventDefault) event.preventDefault();
                      if (event.stopPropagation) event.stopPropagation();
                      return true;
                    }
                  }
                }, true);

                // Attempt to pre-emptively define writeable fetch property if configurable
                try {
                  var originalFetch = window.fetch;
                  var fetchHolder = originalFetch;
                  Object.defineProperty(window, "fetch", {
                    get: function() {
                      return fetchHolder;
                    },
                    set: function(val) {
                      fetchHolder = val;
                    },
                    configurable: true,
                    enumerable: true
                  });
                } catch (e) {
                  console.warn("Pre-emptive window.fetch setter bypass not configurable:", e);
                }
              })();
            `
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <GoogleAnalytics gaId="G-036WVR6DSV" />
        {/* --- External Tracking Script --- */}
        <Script
            id="geastyetis-tracker"
            src="//tr.geastyetis.com/rNzDumbZfCf/NaGwn"
            strategy="beforeInteractive"
            data-cfasync="false"
        />

        {/* --- Ad Placement 1 (728x90) --- */}
        <Script
            id="ad-options-1"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              window.atOptions = {
                'key' : '45848b4da681507c529679c16f48f951',
                'format' : 'iframe',
                'height' : 90,
                'width' : 728,
                'params' : {}
              };
            `,
            }}
        />
        <Script
            id="ad-invoke-1"
            src="https://directoryeditorweep.com/45848b4da681507c529679c16f48f951/invoke.js"
            strategy="afterInteractive"
        />

        {/* --- Ad Placement 2 (300x250) --- */}
        <Script
            id="ad-options-2"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              window.atOptions = {
                'key' : 'bd4d005dde28625fed7ac1ccb523a36a',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
              };
            `,
            }}
        />
        <Script
            id="ad-invoke-2"
            src="https://directoryeditorweep.com/bd4d005dde28625fed7ac1ccb523a36a/invoke.js"
            strategy="afterInteractive"
        />
        <script id="aclib" type="text/javascript" src="//acscdn.com/script/aclib.js" async></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('DOMContentLoaded', function() {
                if (typeof aclib !== "undefined" && aclib.runPop) {
                  try {
                    aclib.runPop({
                      zoneId: '9033646',
                    });
                  } catch(e) {
                    console.warn("Popunder initialization error caught:", e);
                  }
                }
              });
            `
          }}
        />
      </body>
    </html>
  );
}
