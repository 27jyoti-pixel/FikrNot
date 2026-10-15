import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

const CAMPUS_CENTER = [22.288927, 73.364058];
const markerIcon = L.divIcon({
  className: "fikrnot-map-marker",
  html: '<span aria-hidden="true"></span>',
  iconSize: [26, 36],
  iconAnchor: [13, 34],
});

export default function LocationSelector({ value, onChange, error = "" }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const latestValue = useRef(value);
  const latestOnChange = useRef(onChange);
  latestValue.current = value;
  latestOnChange.current = onChange;
  const [mode, setMode] = useState(value.mode || (value.coordinates ? "map" : value.area ? "manual" : ""));
  const [confirmed, setConfirmed] = useState(Boolean(value.confirmed || value.coordinates));
  const [mapStatus, setMapStatus] = useState("idle");
  const [tileWarning, setTileWarning] = useState(false);
  useEffect(() => {
    if (value.mode) setMode(value.mode);
    else if (!mode && (value.coordinates || value.area)) setMode(value.coordinates ? "map" : "manual");
  }, [value.mode, value.coordinates?.[0], value.coordinates?.[1]]);
  useEffect(() => setConfirmed(Boolean(value.confirmed)), [value.confirmed]);
  const validPoint =
    Array.isArray(value.coordinates) &&
    value.coordinates.length === 2 &&
    Number.isFinite(Number(value.coordinates[0])) &&
    Number.isFinite(Number(value.coordinates[1]));

  function chooseMode(nextMode) {
    setMode(nextMode);
    const nextConfirmed = nextMode === "manual" || (nextMode === "map" && validPoint);
    const nextArea = nextMode === "manual" && /^Map point \(/.test(value.area)
      ? ""
      : value.area;
    setConfirmed(nextConfirmed);
    onChange({ ...value, area: nextArea, mode: nextMode, confirmed: nextConfirmed, coordinates: nextMode === "manual" ? null : value.coordinates });
  }

  function selectPoint(coordinates) {
    setConfirmed(false);
    latestOnChange.current({ ...latestValue.current, coordinates, confirmed: false });
  }

  function placeMarker(lat, lng) {
    selectPoint([lng, lat]);
    if (!markerInstance.current) {
      markerInstance.current = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(mapInstance.current);
      markerInstance.current.on("dragend", (event) => {
        const point = event.target.getLatLng();
        placeMarker(point.lat, point.lng);
      });
    } else markerInstance.current.setLatLng([lat, lng]);
  }

  useEffect(() => {
    if (mode !== "map" || !mapElement.current || mapElement.current._leaflet_id) return;
    let map;
    let resizeObserver;
    let initialResizeFrame;
    let tileLayer;
    let resizeHandler;
    let active = true;
    setMapStatus("loading");
    setTileWarning(false);
    try {
      const current = latestValue.current;
      const hasPoint = Array.isArray(current.coordinates) && current.coordinates.length === 2;
      const center = hasPoint ? [Number(current.coordinates[1]), Number(current.coordinates[0])] : CAMPUS_CENTER;
      map = L.map(mapElement.current, { scrollWheelZoom: true }).setView(center, hasPoint ? 16 : 15);
      mapInstance.current = map;
      mapElement.current._leaflet_map = map;
      tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      tileLayer.on("tileerror", () => setTileWarning(true));
      tileLayer.on("tileload", () => setTileWarning(false));
      map.on("click", (event) => placeMarker(event.latlng.lat, event.latlng.lng));
      map.whenReady(() => { if (active) setMapStatus("ready"); });
      const invalidateMapSize = () => map.invalidateSize({ pan: false });
      initialResizeFrame = requestAnimationFrame(invalidateMapSize);
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(invalidateMapSize);
        resizeObserver.observe(mapElement.current);
      } else {
        resizeHandler = invalidateMapSize;
        window.addEventListener("resize", resizeHandler);
      }
    } catch (initializationError) {
      console.error("Could not initialize the report location map.", initializationError);
      setMapStatus("error");
    }
    return () => {
      active = false;
      if (initialResizeFrame) cancelAnimationFrame(initialResizeFrame);
      resizeObserver?.disconnect();
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      map?.remove();
      mapInstance.current = null;
      markerInstance.current = null;
      if (mapElement.current) {
        delete mapElement.current._leaflet_id;
        delete mapElement.current._leaflet_map;
      }
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "map" || !mapInstance.current || !validPoint) return;
    const point = [Number(value.coordinates[1]), Number(value.coordinates[0])];
    if (!markerInstance.current) {
      markerInstance.current = L.marker(point, { icon: markerIcon, draggable: true }).addTo(mapInstance.current);
      mapInstance.current.setView(point, 16);
      markerInstance.current.on("dragend", (event) => {
        const moved = event.target.getLatLng();
        placeMarker(moved.lat, moved.lng);
      });
    } else markerInstance.current.setLatLng(point);
  }, [mode, value.coordinates?.[0], value.coordinates?.[1]]);

  return (
    <section className="location-selector wide" aria-labelledby="location-title">
      <div>
        <strong id="location-title"><MapPin size={16} /> Location</strong>
        <p>How would you like to add the location?</p>
      </div>
      <div className="location-mode-options" role="group" aria-label="Location entry method" aria-describedby={error && error.includes("method") ? "report-location-error" : undefined}>
        <button type="button" className={`location-mode-card ${mode === "map" ? "selected" : ""}`} aria-pressed={mode === "map"} onClick={() => chooseMode("map")}>
          <MapPin size={19} /><span><b>Select location on map</b><small>Choose the exact location on the campus map</small></span>
        </button>
        <button type="button" className={`location-mode-card ${mode === "manual" ? "selected" : ""}`} aria-pressed={mode === "manual"} onClick={() => chooseMode("manual")}>
          <span className="location-pencil" aria-hidden="true">✎</span><span><b>Enter location manually</b><small>Type a place or nearby landmark</small></span>
        </button>
      </div>

      <div className={`location-entry-area location-entry-${mode || "empty"}`}>
        {mode === "map" && (
          <div className="location-map-panel">
            <div className="location-map-wrap">
              <div className="location-map" ref={mapElement} role="group" aria-label="Interactive campus map; select a point to place the marker" aria-invalid={Boolean(error && error.includes("map"))} aria-describedby={error && error.includes("map") ? "report-location-error" : undefined} />
              {mapStatus === "loading" && <small className="location-map-status" role="status">Loading campus map…</small>}
              {mapStatus === "error" && <small className="location-map-status error" role="alert">The map could not start. You can still enter the place manually.</small>}
              {tileWarning && mapStatus === "ready" && <small className="location-map-status warning" role="status">Map tiles are unavailable. Try again or enter the location manually.</small>}
            </div>
            <label>
              Place or nearby landmark <span className="optional">(optional)</span>
              <input id="report-location-area" maxLength="200" value={value.area} placeholder="Optional description, e.g. near the library entrance" onChange={(event) => { setConfirmed(false); onChange({ ...value, area: event.target.value, confirmed: false }); }} />
            </label>
            <div className="location-selection-row">
              <small>{validPoint ? `Latitude ${Number(value.coordinates[1]).toFixed(6)}, longitude ${Number(value.coordinates[0]).toFixed(6)}${confirmed ? ` · ${value.area || "Map point selected"}` : ""}` : "Click the map to place a marker. You can zoom and pan to choose the point."}</small>
              <button type="button" className="button outline small" disabled={!validPoint} onClick={() => { const area = value.area.trim() || `Map point (${Number(value.coordinates[1]).toFixed(6)}, ${Number(value.coordinates[0]).toFixed(6)})`; setConfirmed(true); onChange({ ...value, area, confirmed: true }); }}>{confirmed ? "Location confirmed" : "Confirm location"}</button>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <label className="wide">
            Place or nearby landmark
            <input id="report-location-area" required maxLength="200" value={value.area} placeholder="e.g. College library, Hostel Block A" aria-invalid={Boolean(error && error.includes("landmark"))} aria-describedby={error && error.includes("landmark") ? "report-location-error" : undefined} onChange={(event) => onChange({ ...value, area: event.target.value, coordinates: null })} />
          </label>
        )}

        {!mode && <small>Select a method to continue.</small>}
      </div>

      {error && <small id="report-location-error" className="inline-error" role="alert">{error}</small>}

      {(value.area || validPoint) && (
        <button type="button" className="location-clear" onClick={() => {
          setConfirmed(false);
          onChange({ ...value, area: "", coordinates: null, confirmed: false });
        }}>Clear location selection</button>
      )}

    </section>
  );
}
