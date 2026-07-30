import type * as Leaflet from "leaflet";

export interface CooperativeGestureOptions {
  /**
   * When true, a one-finger drag scrolls the PAGE and only two fingers pan the
   * map. Required for any map inside a scrolling container — otherwise the map
   * swallows the scroll gesture and the rider gets stuck on it, unable to
   * reach the button below.
   *
   * Set false for a full-screen map, where there is no page scroll to lose.
   */
  readonly requireTwoFingerPan: boolean;
  /** Shown when the wheel is used without the modifier key. */
  readonly onWheelHint?: (visible: boolean) => void;
}

/**
 * Makes a Leaflet map pannable and zoomable without hijacking the page.
 *
 * This is the behaviour Google Maps calls `gestureHandling: "cooperative"`,
 * which is what Uber and Bolt use for a map embedded in a scrollable sheet:
 *
 *  - wheel alone scrolls the page; ctrl/⌘ + wheel zooms the map
 *  - one finger scrolls the page; two fingers pan and pinch-zoom the map
 *  - double-tap, keyboard arrows and the zoom buttons always work
 *
 * Returns a cleanup function that detaches every listener it added.
 */
export function enableCooperativeGestures(
  map: Leaflet.Map,
  container: HTMLElement,
  { requireTwoFingerPan, onWheelHint }: CooperativeGestureOptions,
): () => void {
  map.dragging.enable();
  map.touchZoom.enable();
  map.doubleClickZoom.enable();
  map.keyboard.enable();
  // Never plain-wheel: that is the page's gesture. Zoom is opt-in below.
  map.scrollWheelZoom.disable();

  let hintTimer: ReturnType<typeof setTimeout> | null = null;

  /** Ctrl/⌘ + wheel zooms; a bare wheel is left to the page, with a nudge. */
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // deltaY is inverted relative to zoom: scrolling up should zoom in.
      map.setZoomAround(
        map.mouseEventToLatLng(e as unknown as MouseEvent),
        map.getZoom() - Math.sign(e.deltaY) * 0.5,
      );
      onWheelHint?.(false);
      return;
    }
    onWheelHint?.(true);
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => onWheelHint?.(false), 1600);
  };

  // Touch: gate dragging on finger count so a single finger stays with the page.
  const onTouchStart = (e: TouchEvent) => {
    if (!requireTwoFingerPan) return;
    if (e.touches.length >= 2) map.dragging.enable();
    else map.dragging.disable();
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!requireTwoFingerPan) return;
    if (e.touches.length < 2) map.dragging.disable();
  };

  if (requireTwoFingerPan) {
    // Start disabled: the first finger down must not pan.
    map.dragging.disable();
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
  }
  // Not passive: ctrl+wheel calls preventDefault to stop the browser zooming.
  container.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    if (hintTimer) clearTimeout(hintTimer);
    container.removeEventListener("wheel", onWheel);
    container.removeEventListener("touchstart", onTouchStart);
    container.removeEventListener("touchend", onTouchEnd);
    container.removeEventListener("touchcancel", onTouchEnd);
  };
}
