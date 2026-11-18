import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "./index.css";
import App from "./App.jsx";
import { isNative } from "./utils/native";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// offline support for the web build only: the Android and Windows apps ship their files locally
// (Electron loads from file://, where service workers are not available)
if (import.meta.env.PROD && !isNative && location.protocol.startsWith("http") && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
