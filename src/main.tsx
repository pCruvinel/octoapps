
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { DocumentSettingsProvider } from "./components/pdf-engine/DocumentContext";

createRoot(document.getElementById("root")!).render(
  <DocumentSettingsProvider>
    <App />
  </DocumentSettingsProvider>
);
