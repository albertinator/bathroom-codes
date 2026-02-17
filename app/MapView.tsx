"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

// Fix default marker icons for Leaflet in bundled environments
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface Location {
  id: number;
  name: string;
  address: string;
  code: string;
  lat: number;
  lng: number;
}

const allBounds = (locations: Location[]): L.LatLngBoundsExpression => {
  const lats = locations.map((l) => l.lat);
  const lngs = locations.map((l) => l.lng);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
};

function MapController({
  userLocation,
  locations,
}: {
  userLocation: { lat: number; lng: number } | null;
  locations: Location[];
}) {
  const map = useMap();
  const [zoomed, setZoomed] = useState(false);

  // On first render, if user location is known, fit bounds to include user + nearest location
  useEffect(() => {
    if (userLocation && !zoomed) {
      const nearest = locations.reduce((best, loc) => {
        const d = Math.hypot(loc.lat - userLocation.lat, loc.lng - userLocation.lng);
        return d < best.d ? { loc, d } : best;
      }, { loc: locations[0], d: Infinity });

      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [nearest.loc.lat, nearest.loc.lng],
      );
      map.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 14 });
      setZoomed(true);
    }
  }, [userLocation, zoomed, map, locations]);

  const handleShowAll = () => {
    map.fitBounds(allBounds(locations), { padding: [40, 40], animate: true });
  };

  const handleZoomToMe = () => {
    if (userLocation) {
      const nearest = locations.reduce((best, loc) => {
        const d = Math.hypot(loc.lat - userLocation.lat, loc.lng - userLocation.lng);
        return d < best.d ? { loc, d } : best;
      }, { loc: locations[0], d: Infinity });

      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [nearest.loc.lat, nearest.loc.lng],
      );
      map.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 14 });
    }
  };

  return (
    <div
      className="flex gap-1.5"
      style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, pointerEvents: "auto" }}
    >
      {userLocation && (
        <button
          onClick={handleZoomToMe}
          className="cursor-pointer rounded bg-white p-1.5 text-zinc-700 shadow-md hover:bg-zinc-50"
          title="Zoom to my location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3" />
            <path d="M12 19v3" />
            <path d="M2 12h3" />
            <path d="M19 12h3" />
          </svg>
        </button>
      )}
      <button
        onClick={handleShowAll}
        className="cursor-pointer rounded bg-white p-1.5 text-zinc-700 shadow-md hover:bg-zinc-50"
        title="See all locations"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6" />
          <path d="M9 21H3v-6" />
          <path d="M21 3l-7 7" />
          <path d="M3 21l7-7" />
        </svg>
      </button>
    </div>
  );
}

export default function MapView({
  locations,
  userLocation,
}: {
  locations: Location[];
  userLocation: { lat: number; lng: number } | null;
}) {
  // Default: fit all locations
  const defaultCenter: [number, number] = [42.65, -71.25];

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
        zoom={userLocation ? 13 : 9}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController userLocation={userLocation} locations={locations} />
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
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ fontSize: 14 }}>{loc.name}</strong>
                <br />
                <span style={{ fontSize: 12, color: "#666" }}>
                  {loc.address}
                </span>
                <hr style={{ margin: "6px 0" }} />
                <span style={{ fontSize: 12, color: "#666" }}>Code: </span>
                <strong
                  style={{ fontSize: 16, fontFamily: "monospace", color: "#1d4ed8" }}
                >
                  {loc.code}
                </strong>
                <br />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ", " + loc.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  Directions &#8599;
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
