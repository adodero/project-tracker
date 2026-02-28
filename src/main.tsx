import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("virtualKeyboard" in navigator) {
  (navigator as any).virtualKeyboard.overlaysContent = false;
}

document.addEventListener("focusin", (e) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  ) {
    const isInOverlay =
      target.closest("[role='dialog']") ||
      target.closest("[data-radix-popper-content-wrapper]");
    if (isInOverlay) return;

    const hasOwnScrollHandler = target.dataset.testid === "input-new-task-title";
    if (hasOwnScrollHandler) return;

    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
