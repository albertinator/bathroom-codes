"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface Location {
  id: number;
  name: string;
  address: string;
  code: string;
  lat: number;
  lng: number;
}

function getDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [view, setView] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const requestLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);

        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        )
          .then((res) => res.json())
          .then((data) => {
            const addr = data.address;
            const city =
              addr?.city || addr?.town || addr?.village || addr?.hamlet;
            const state = addr?.state;
            if (city && state) {
              // Abbreviate US state names
              const stateAbbr =
                state.length > 2 ? state.replace(/\b(\w)\w*\s*/g, "$1").toUpperCase() : state;
              setLocationName(`${city}, ${stateAbbr}`);
            } else if (city) {
              setLocationName(city);
            }
          })
          .catch(() => {
            // Reverse geocoding failed; coordinates will be used as fallback
          });
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied"
            : "Could not detect location",
        );
        setLocationLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then(setLocations)
      .catch(() => {
        // Locations fetch failed; list will remain empty
      });
  }, []);

  const sortedLocations = userLocation
    ? [...locations]
        .map((loc) => ({
          ...loc,
          distance: getDistanceMiles(
            userLocation.lat,
            userLocation.lng,
            loc.lat,
            loc.lng,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
    : locations.map((loc) => ({ ...loc, distance: null as number | null }));

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-3xl font-bold text-zinc-900">
            Bathroom Codes
          </h1>
          <div className="text-sm text-zinc-500">
            {locationLoading ? (
              <span>Detecting location...</span>
            ) : locationError ? (
              <span>
                {locationError}
                {" · "}
                <button
                  onClick={requestLocation}
                  className="cursor-pointer font-medium text-blue-600 hover:text-blue-800"
                >
                  Retry
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 14 14" className="inline-block">
                  <circle cx="7" cy="7" r="5.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                </svg>
                {" "}Near{" "}
                {locationName ||
                  `${userLocation!.lat.toFixed(2)}, ${userLocation!.lng.toFixed(2)}`}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-lg bg-zinc-200 p-1">
          <button
            onClick={() => setView("list")}
            className={`flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "list"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === "map"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Map
          </button>
        </div>

        {view === "list" ? (
          <div className="flex flex-col gap-3">
            {sortedLocations.map((loc) => (
              <div
                key={loc.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {loc.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {loc.address}
                      {loc.distance != null && (
                        <span className="ml-2 text-zinc-400">
                          ~{loc.distance < 0.1
                            ? loc.distance.toFixed(2)
                            : loc.distance < 10
                              ? loc.distance.toFixed(1)
                              : Math.round(loc.distance)}{" "}
                          mi
                        </span>
                      )}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ", " + loc.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M8.157 2.175a1.5 1.5 0 0 0-1.147 0l-4.084 1.69A1.5 1.5 0 0 0 2 5.251v10.877a1.5 1.5 0 0 0 2.074 1.386l3.51-1.453 4.26 1.763a1.5 1.5 0 0 0 1.147 0l4.084-1.69A1.5 1.5 0 0 0 18 14.748V3.873a1.5 1.5 0 0 0-2.074-1.386l-3.51 1.453-4.26-1.763ZM7.58 5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 7.58 5Zm5.59 2.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" clipRule="evenodd" />
                      </svg>
                      Directions
                    </a>
                  </div>
                  <div className="rounded-lg bg-blue-50 px-3 py-1.5">
                    <span className="font-mono text-lg font-bold text-blue-700">
                      {loc.code}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <MapView locations={locations} userLocation={userLocation} />
        )}
      </div>
    </div>
  );
}
