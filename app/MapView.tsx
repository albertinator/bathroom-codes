"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export default function MapView({ locations }: { locations: Location[] }) {
  // Center the map to show all locations (roughly between Boston and Manchester)
  const center: [number, number] = [42.65, -71.25];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={9}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
