import { useEffect, useState } from "react";

/**
 * 100dvh doesn't reliably shrink for the on-screen keyboard on every mobile
 * browser (notably some Android WebViews), which can push the composer
 * below the visible area. The VisualViewport API reports the actual visible
 * height + offset, so we use it when available and fall back to dvh
 * otherwise. Pair this with `position: fixed` on the container — a
 * normal-flow element can still get dragged around when iOS auto-scrolls
 * the page to bring a focused input into view; a fixed element can't.
 */
export function useVisualViewport(): { height: string; offsetTop: number } {
  const [state, setState] = useState<{ height: number | null; offsetTop: number }>({
    height: null,
    offsetTop: 0,
  });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function update() {
      const viewport = window.visualViewport;
      if (!viewport) return;
      setState({ height: viewport.height, offsetTop: viewport.offsetTop });
    }
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return { height: state.height ? `${state.height}px` : "100dvh", offsetTop: state.offsetTop };
}
