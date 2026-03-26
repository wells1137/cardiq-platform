import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./AppProvider";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppProvider />
  </React.StrictMode>
);
