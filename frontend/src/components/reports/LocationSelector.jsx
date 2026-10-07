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

export default function LocationSelector({ value, onChange }) {
  const mapElement = useRef(null);
  const latestValue = useRef(value);
  const latestOnChange = useRef(onChange);
  latestValue.current = value;
  latestOnChange.current = onChange;
  const [mode, setMode] = useState(value.mode || (value.coordinates ? "map" : value.area ? "manual" : ""));
  const [confirmed, setConfirmed] = useState(Boolean(value.confirmed || value.coordinates));
  useEffect(() => {
    if (value.mode) setMode(value.mode);
    else if (!mode && (value.coordinates || value.area)) setMode(value.coordinates ? "map" : "manual");
  }, [value.mode, value.coordinates?.[0], value.coordinates?.[1]]);
  const validPoint =
    Array.isArray(value.coordinates) &&
    value.coordinates.length === 2 &&
    Number.isFinite(Number(value.coordinates[0])) &&
    Number.isFinite(Number(value.coordinates[1]));

  function chooseMode(nextMode) {
    setMode(nextMode);
    const nextConfirmed = nextMode === "manual" || (nextMode === "map" && validPoint);
    setConfirmed(nextConfirmed);
    onChange({ ...value, mode: nextMode, confirmed: nextConfirmed, coordinates: nextMode === "manual" ? null : value.coordinates });
  }

  function selectPoint(coordinates) {
    setConfirmed(false);
    latestOnChange.current({ ...latestValue.current, coordinates, confirmed: false });
  }

  useEffect(() => {
    if (mode !== "map" || !mapElement.current || mapElement.current._leaflet_id) return;
    const center = validPoint ? [Number(value.coordinates[1]), Number(value.coordinates[0])] : CAMPUS_CENTER;
    const map = L.map(mapElement.current).setView(center, validPoint ? 16 : 15);
    mapElement.current._leaflet_map = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    let marker;
    function placeMarker(lat, lng) {
      selectPoint([lng, lat]);
      if (!marker) marker = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(map);
      else marker.setLatLng([lat, lng]);
    }
    map.on("click", (event) => placeMarker(event.latlng.lat, event.latlng.lng));
    if (validPoint) {
      marker = L.marker(center, { icon: markerIcon, draggable: true }).addTo(map);
      marker.on("dragend", (event) => {
        const point = event.target.getLatLng();
        placeMarker(point.lat, point.lng);
      });
    }
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapElement.current);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      if (mapElement.current) {
        delete mapElement.current._leaflet_id;
        delete mapElement.current._leaflet_map;
      }
    };
  }, [mode]);

  return (
    <section className="location-selector wide" aria-labelledby="location-title">
      <div>
        <strong id="location-title"><MapPin size={16} /> Location</strong>
        <p>How would you like to add the location?</p>
      </div>
      <div className="location-mode-options" role="group" aria-label="Location entry method">
        <button type="button" className={`location-mode-card ${mode === "map" ? "selected" : ""}`} aria-pressed={mode === "map"} onClick={() => chooseMode("map")}>
          <MapPin size={19} /><span><b>Select location on map</b><small>Choose the exact location on the campus map</small></span>
        </button>
        <button type="button" className={`location-mode-card ${mode === "manual" ? "selected" : ""}`} aria-pressed={mode === "manual"} onClick={() => chooseMode("manual")}>
          <span className="location-pencil" aria-hidden="true">✎</span><span><b>Enter location manually</b><small>Type a place or nearby landmark</small></span>
        </button>
      </div>

      {mode === "map" && (
        <div className="location-map-panel">
          <div className="location-map" ref={mapElement} aria-label="Interactive campus map; select a point to place the marker" />
          <label>
            Selected place or nearby landmark
            <input required maxLength="200" value={value.area} placeholder="e.g. Central Canteen, Library, near Main Gate" onChange={(event) => { setConfirmed(false); onChange({ ...value, area: event.target.value, confirmed: false }); }} />
          </label>
          <div className="location-selection-row">
            <small>{validPoint ? `Longitude ${Number(value.coordinates[0]).toFixed(6)}, latitude ${Number(value.coordinates[1]).toFixed(6)}` : "Tap or click the map to place a marker."}</small>
            <button type="button" className="button outline small" disabled={!validPoint || !value.area.trim()} onClick={() => { setConfirmed(true); onChange({ ...value, confirmed: true }); }}>{confirmed ? "Location confirmed" : "Confirm location"}</button>
          </div>
          {validPoint && !confirmed && <small className="inline-error">Confirm the selected point before submitting.</small>}
        </div>
      )}

      {mode === "manual" && (
        <label className="wide">
          Location
          <input required maxLength="200" value={value.area} placeholder="e.g. Parul University, Waghodia, Vadodara" onChange={(event) => onChange({ ...value, area: event.target.value, coordinates: null })} />
        </label>
      )}

      {(value.area || validPoint) && (
        <button type="button" className="location-clear" onClick={() => {
          setConfirmed(false);
          onChange({ ...value, area: "", coordinates: null, confirmed: false });
        }}>Clear location selection</button>
      )}

      {!mode && <small>Select a method to continue.</small>}
    </section>
  );
}
