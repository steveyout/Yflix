import type { Metadata } from "next";
import React from "react";
import "../index.css";

export const metadata: Metadata = {
  title: "YFlix | Watch Free Movies and TV Shows Online",
  description: "YFlix offers free access to the latest movies and TV shows in high quality. Enjoy a vast library of entertainment and interact with our integrated AI chatbot.",
  keywords: ["free movies", "watch tv shows online", "streaming site", "high quality movies", "entertainment", "AI chatbot"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 200 200' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='bgGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ff5252' /%3E%3Cstop offset='60%25' stop-color='%23d30f0f' /%3E%3Cstop offset='100%25' stop-color='%23800202' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='0' y='0' width='200' height='200' rx='54' fill='url(%23bgGrad)' /%3E%3Cpath d='M 54,0 C 120,0 200,60 200,130 C 200,175 165,200 120,200 C 50,200 0,130 0,60 C 0,25 25,0 54,0 Z' fill='%23000000' opacity='0.15' /%3E%3Cpath d='M 54,0 C 130,10 200,80 200,140 C 200,190 140,200 80,200 C 20,180 0,110 0,60 C 0,10 20,0 54,0 Z' fill='%23ff0000' opacity='0.1' /%3E%3Cpath d='M 78,56 C 78,51.5 83,48.5 87,51 L 151,89 C 155,91.5 155,97.5 151,100 L 87,138 C 83,140.5 78,137.5 78,133 Z' fill='%23ffffff' /%3E%3Crect x='2.5' y='2.5' width='195' height='195' rx='51.5' stroke='%23ffffff' stroke-opacity='0.12' stroke-width='5' /%3E%3C/svg%3E" />
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-036WVR6DSV"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-036WVR6DSV');
            `
          }}
        />
      </head>
      <body className="antialiased">
        {children}
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
