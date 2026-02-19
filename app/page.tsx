"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import AddLocationSheet from "./AddLocationSheet";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface Location {
  id: number;
  name: string;
  address: string;
  code: string;
  lat: number;
  lng: number;
  notes?: string | null;
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
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const fetchLocations = useCallback(() => {
    fetch("/api/locations")
      .then((res) => {
        if (!res.ok) throw new Error("Bad response");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid data");
        setLocations(
          data.filter(
            (loc) =>
              typeof loc.lat === "number" &&
              typeof loc.lng === "number" &&
              isFinite(loc.lat) &&
              isFinite(loc.lng),
          ),
        );
        setLocationsLoading(false);
        setLocationsError(false);
      })
      .catch(() => {
        setLocationsError(true);
        setLocationsLoading(false);
      });
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleLocationAdded = useCallback(() => {
    fetchLocations();
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  }, [fetchLocations]);

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
          locationsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
              ))}
            </div>
          ) : locationsError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-zinc-700">Could not load location data</p>
              <p className="mt-1 text-sm text-zinc-400">The database may be unreachable. Try refreshing the page.</p>
            </div>
          ) : sortedLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-zinc-700">No locations yet</p>
              <p className="mt-1 text-sm text-zinc-400">Tap + to add a bathroom code.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-3">
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
                      {loc.notes && (
                        <p className="mt-1 text-sm italic text-zinc-400">
                          {loc.notes}
                        </p>
                      )}
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
                    <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5">
                      <span className="font-mono text-lg font-bold text-blue-700">
                        {loc.code}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <MapView locations={locations} userLocation={userLocation} />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:bg-blue-700 active:scale-95"
        aria-label="Add location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
      </button>

      <AddLocationSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        userLocation={userLocation}
        onLocationAdded={handleLocationAdded}
      />

      {/* Success toast */}
      <div
        className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          showToast
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0 text-green-400"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          </svg>
          Location saved!
        </div>
      </div>
    </div>
  );
}
