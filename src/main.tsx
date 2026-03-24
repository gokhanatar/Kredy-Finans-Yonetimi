import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./i18n";
import "./index.css";

// Global error handler — prevents blank screen on unhandled errors
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UnhandledRejection]', e.reason);
  e.preventDefault();
});

const root = document.getElementById("root");
if (root) {
  try {
    createRoot(root).render(<App />);
  } catch (err) {
    console.error('[RenderError]', err);
    root.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;text-align:center;padding:2rem;">
        <div>
          <h2 style="font-size:1.25rem;margin-bottom:0.5rem;">Uygulama Yüklenemedi</h2>
          <p style="color:#666;margin-bottom:1rem;">Lütfen uygulamayı kapatıp tekrar açın.</p>
          <button onclick="location.reload()" style="padding:0.5rem 1.5rem;border:1px solid #ddd;border-radius:0.5rem;cursor:pointer;">Yenile</button>
        </div>
      </div>`;
  }
}
