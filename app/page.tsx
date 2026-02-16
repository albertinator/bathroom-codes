"use client";

import { useState } from "react";
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

const locations: Location[] = [
  {
    id: 1,
    name: "Best Buy",
    address: "14 Allstate Rd, Dorchester, MA 02125",
    code: "13579#",
    lat: 42.3468,
    lng: -71.0545,
  },
  {
    id: 2,
    name: "Tatte Bakery & Cafe",
    address: "60 Old Colony Ave, Boston, MA 02127",
    code: "12345",
    lat: 42.3375,
    lng: -71.0503,
  },
  {
    id: 3,
    name: "Panera Bread",
    address: "8 Allstate Rd Suite 3, Dorchester, MA 02125",
    code: "4589",
    lat: 42.3465,
    lng: -71.0540,
  },
  {
    id: 4,
    name: "Raising Cane's",
    address: "782 S Willow St, Manchester, NH 03103",
    code: "2060",
    lat: 42.9634,
    lng: -71.4618,
  },
];

export default function Home() {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900">
          Bathroom Codes
        </h1>
        <p className="mb-6 text-zinc-500">
          {locations.length} saved locations
        </p>

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
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {loc.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">{loc.address}</p>
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
          <MapView locations={locations} />
        )}
      </div>
    </div>
  );
}
