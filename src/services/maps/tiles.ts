import { mapboxToken, mapboxUsable } from "./mapbox-loader";

export interface TileConfig {
  readonly url: string;
  readonly options: Record<string, unknown>;
}

/**
 * Key-free fallback basemap (CARTO Voyager) — light, readable, no account
 * needed. Used whenever Mapbox isn't configured or its token is rejected.
 */
const CARTO_TILES: TileConfig = {
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  options: {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
};

/**
 * Mapbox raster tiles. Served as 512px @2x tiles, which is why Leaflet needs
 * tileSize 512 + zoomOffset -1 — without those the map renders one zoom level
 * too far out and every label looks oversized.
 */
function mapboxTiles(): TileConfig {
  return {
    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken()}`,
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
 */
export function basemapTiles(): TileConfig {
  return mapboxUsable() ? mapboxTiles() : CARTO_TILES;
}
