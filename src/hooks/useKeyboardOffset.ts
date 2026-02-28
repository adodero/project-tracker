import { useState, useEffect, useCallback } from "react";

const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 640;

export const useKeyboardOffset = () => {
  const [offset, setOffset] = useState(0);

  const update = useCallback(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const keyboardHeight = window.innerHeight - vv.height;
    setOffset(keyboardHeight > 50 ? keyboardHeight : 0);
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    update();

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [update]);

  return offset;
};

const ESTIMATED_KEYBOARD_HEIGHT = 300;

export const useMobileInputFocused = () => {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!isMobile()) return;

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
        setFocused(true);
      }
    };
    const onFocusOut = () => {
      setFocused(false);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return focused;
};

export const useEffectiveKeyboardHeight = () => {
  const vpOffset = useKeyboardOffset();
  const inputFocused = useMobileInputFocused();

  if (vpOffset > 0) return vpOffset;
  if (inputFocused) return ESTIMATED_KEYBOARD_HEIGHT;
  return 0;
};
