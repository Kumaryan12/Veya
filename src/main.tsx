import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Overlay } from "./features/reminders/Overlay";
import "./styles/index.css";

const isOverlay = new URLSearchParams(window.location.search).get("overlay") === "true";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isOverlay ? <Overlay /> : <App />}</StrictMode>,
);

