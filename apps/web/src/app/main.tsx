import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EditorPage } from "@/pages/editor";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("missing #root element in index.html");

createRoot(container).render(
  <StrictMode>
    <EditorPage />
  </StrictMode>,
);
