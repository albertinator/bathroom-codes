"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
}

function FitBounds({
  results,
  userLocation,
}: {
  results: SearchResult[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (results.length === 0) return;
    const points: [number, number][] = results.map((r) => [r.lat, r.lng]);
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: false });
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: false, maxZoom: 15 });
    }
  }, [results, map]);

  // Suppress unused warning — userLocation intentionally unused here
  void userLocation;

  return null;
}

export default function SearchResultsMap({
  results,
  userLocation,
  hasCode,
  onSelect,
}: {
  results: SearchResult[];
  userLocation: { lat: number; lng: number } | null;
  hasCode: (placeId: string) => boolean;
  onSelect: (result: SearchResult) => void;
}) {
  const defaultCenter: [number, number] =
    results.length > 0 ? [results[0].lat, results[0].lng] : [42.65, -71.25];

  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "340px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds results={results} userLocation={userLocation} />
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#fff",
              weight: 3,
              fillColor: "#3b82f6",
              fillOpacity: 1,
            }}
          >
            <Popup>Your location</Popup>
          </CircleMarker>
        )}
        {results.map((result, i) => (
          <Marker key={result.placeId || i} position={[result.lat, result.lng]}>
            <Popup>
              <div style={{ minWidth: 150 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <strong style={{ fontSize: 13 }}>{result.name}</strong>
                  {result.distance != null && (
                    <span style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {result.distance < 0.1
                        ? result.distance.toFixed(2)
                        : result.distance < 10
                          ? result.distance.toFixed(1)
                          : Math.round(result.distance)}{" "}mi
                    </span>
                  )}
                </div>
                {result.address && (
                  <>
                    <br />
                    <span style={{ fontSize: 11, color: "#666" }}>
                      {result.address}
                    </span>
                  </>
                )}
                {hasCode(result.placeId) && (
                  <div style={{ marginTop: 5 }}>
                    <span
                      style={{
                        fontSize: 11,
                        background: "#fef3c7",
                        color: "#92400e",
                        padding: "1px 7px",
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      Have code
                    </span>
                  </div>
                )}
                <button
                  onClick={() => onSelect(result)}
                  style={{
                    display: "block",
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    background: "#2563eb",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 0",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Select
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
