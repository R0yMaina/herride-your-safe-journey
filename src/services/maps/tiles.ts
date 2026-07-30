import { mapboxToken, mapboxUsable } from "./mapbox-loader";

export interface TileConfig {
  readonly url: string;
  readonly options: Record<string, unknown>;
}

/**
 * Key-free fallback basemap (CARTO Voyager) — light, readable, no account
 * needed. Used whenever Mapbox isn't configured or its token is rejected.
 *
 * `@2x` is hardcoded rather than written as Leaflet's `{r}` placeholder.
 * `{r}` only expands to "@2x" when `detectRetina` is on, and with it off the
 * URL resolved to plain 256px tiles that every phone then upscaled — the map
 * looked soft on any modern screen. Asking for the 512px image and laying it
 * out in a 256px slot gives exactly 2x density, with no zoom shift (which is
 * what `detectRetina` would add on top).
 */
function cartoTiles(style: "voyager" | "dark_all"): TileConfig {
  return {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}@2x.png`,
    options: {
      subdomains: "abcd",
      tileSize: 256,
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    },
  };
}

/**
 * Mapbox raster tiles. Served as 512px @2x tiles, which is why Leaflet needs
 * tileSize 512 + zoomOffset -1 — without those the map renders one zoom level
 * too far out and every label looks oversized.
 */
function mapboxTiles(dark: boolean): TileConfig {
  const style = dark ? "dark-v11" : "streets-v12";
  return {
    url: `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken()}`,
    options: {
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 20,
      attribution: "&copy; Mapbox &copy; OpenStreetMap",
    },
  };
}

/**
 * The basemap every Leaflet map draws. Resolved at call time (not module
 * load) so a token rejection mid-session falls back to CARTO on the next map
 * that mounts.
 *
 * Pass `dark` to get the night style. A light map panel inside the dark theme
 * is the one thing that reads as unfinished — every ride app switches its
 * basemap with the UI.
 */
export function basemapTiles(dark = false): TileConfig {
  return mapboxUsable() ? mapboxTiles(dark) : cartoTiles(dark ? "dark_all" : "voyager");
}
