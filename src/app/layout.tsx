import type { Metadata } from "next";
import React from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../index.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yflix.online"),
  title: "YFlix | Watch Free Movies and TV Shows Online",
  description: "YFlix offers free access to the latest movies and TV shows in high quality. Enjoy a vast library of entertainment and interact with our integrated AI chatbot.",
  keywords: ["free movies", "watch tv shows online", "streaming site", "high quality movies", "entertainment", "AI chatbot"],
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
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
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
