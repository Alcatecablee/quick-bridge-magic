import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

// Catch stale asset 404s (which happen when a user has the app open during a new
// Vercel deployment) and auto-reload to fetch the fresh index.html.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
