import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error shield to catch and suppress unhandled third-party/iframe fetch getter re-assignment errors.
if (typeof window !== "undefined") {
  const isFetchGetterError = (msg: string): boolean => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes("cannot set property fetch") ||
      lower.includes("only a getter") ||
      lower.includes("property fetch of")
    );
  };

  window.addEventListener("error", (event) => {
    if (event && event.message && isFetchGetterError(event.message)) {
      console.warn("[Muted Sandbox Error]:", event.message);
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (event && event.reason) {
      const msg = event.reason.message || String(event.reason);
      if (msg && isFetchGetterError(msg)) {
        console.warn("[Muted Sandbox Rejection]:", msg);
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
