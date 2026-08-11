import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hover-intent + click dropdown controller.
 * - hover opens, small pointer gap tolerated via close delay
 * - click opens and pins the menu open
 * - click outside / Escape closes
 */
export function useNavDropdown() {
  const [open, setOpen] = useState(false);
  const pinnedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionRef = useRef<HTMLDivElement | null>(null);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const openNow = useCallback(() => {
    clear();
    setOpen(true);
  }, []);

  const closeSoon = useCallback(() => {
    clear();
    timer.current = setTimeout(() => {
      if (!pinnedRef.current) setOpen(false);
    }, 180);
  }, []);

  const close = useCallback(() => {
    clear();
    pinnedRef.current = false;
    setOpen(false);
  }, []);

  const toggleClick = useCallback(() => {
    clear();
    setOpen((prev) => {
      const next = !(prev && pinnedRef.current);
      pinnedRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!regionRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => clear, []);

  return { open, openNow, closeSoon, close, toggleClick, regionRef };
}
