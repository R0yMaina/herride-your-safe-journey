/**
 * Shared basemap tile config. Light, readable street map (CARTO Voyager) —
 * free, no API key. Used by every Leaflet map so the look stays consistent.
 */
export const LIGHT_TILES = {
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  options: {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
} as const;
