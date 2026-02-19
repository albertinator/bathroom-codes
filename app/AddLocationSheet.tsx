"use client";

import { useState, useEffect, useRef } from "react";

interface SearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
}

function getDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  open: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  onLocationAdded: () => void;
}

export default function AddLocationSheet({
  open,
  onClose,
  userLocation,
  onLocationAdded,
}: Props) {
  const [step, setStep] = useState<"search" | "code">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Reset state after the sheet closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setStep("search");
        setQuery("");
        setResults([]);
        setSelected(null);
        setCode("");
        setNotes("");
        setSubmitError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Auto-focus the relevant input when the sheet opens or step changes
  useEffect(() => {
    if (!open) return;
    if (step === "search") {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => codeInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, step]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const params = new URLSearchParams({ q: query });
        if (userLocation) {
          params.set("lat", String(userLocation.lat));
          params.set("lng", String(userLocation.lng));
        }
        const res = await fetch(`/api/search?${params}`, {
          signal: abortRef.current.signal,
        });
        const data: SearchResult[] = await res.json();
        if (userLocation) {
          data.forEach((r) => {
            r.distance = getDistanceMiles(
              userLocation.lat,
              userLocation.lng,
              r.lat,
              r.lng,
            );
          });
          data.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        }
        setResults(data);
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      setSearching(false);
    };
  }, [query, userLocation]);

  const handleSelect = (result: SearchResult) => {
    setSelected(result);
    setStep("code");
  };

  const handleBack = () => {
    setStep("search");
    setCode("");
    setNotes("");
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!selected || !code.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          address: selected.address,
          code: code.trim(),
          lat: selected.lat,
          lng: selected.lng,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      onLocationAdded();
      onClose();
    } catch {
      setSubmitError("Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        {step === "search" ? (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center px-4 pb-3 pt-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                Add a Location
              </h2>
              <button
                onClick={onClose}
                className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Search input */}
            <div className="shrink-0 px-4 pb-3">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && resultRefs.current[0]) {
                      e.preventDefault();
                      resultRefs.current[0]?.focus();
                    }
                  }}
                  placeholder="Search for a business..."
                  autoComplete="off"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1">
              {searching ? (
                <div className="py-10 text-center text-sm text-zinc-400">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {results.map((result, i) => (
                    <button
                      key={i}
                      ref={(el) => { resultRefs.current[i] = el; }}
                      onClick={() => handleSelect(result)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          resultRefs.current[i + 1]?.focus();
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          if (i === 0) searchInputRef.current?.focus();
                          else resultRefs.current[i - 1]?.focus();
                        }
                      }}
                      className="w-full cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:bg-blue-50"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-medium text-zinc-900">
                          {result.name}
                        </div>
                        {result.distance != null && (
                          <div className="shrink-0 text-sm text-zinc-400">
                            {result.distance < 0.1
                              ? result.distance.toFixed(2)
                              : result.distance < 10
                                ? result.distance.toFixed(1)
                                : Math.round(result.distance)}{" "}
                            mi
                          </div>
                        )}
                      </div>
                      {result.address && (
                        <div className="mt-0.5 text-sm text-zinc-500">
                          {result.address}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="py-10 text-center text-sm text-zinc-400">
                  No results found
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-zinc-400">
                  Search by business name or address
                  {userLocation && (
                    <span className="mt-1 block text-xs text-zinc-300">
                      Results closest to you will appear first
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="relative flex shrink-0 items-center px-4 pb-3 pt-2">
              <button
                onClick={handleBack}
                className="flex cursor-pointer items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                Back
              </button>
              <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-zinc-900">
                Enter Code
              </h2>
              <button
                onClick={onClose}
                className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-10">
              {/* Selected business */}
              <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="font-medium text-zinc-900">{selected?.name}</div>
                {selected?.address && (
                  <div className="mt-0.5 text-sm text-zinc-500">
                    {selected.address}
                  </div>
                )}
              </div>

              {/* Code input */}
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Bathroom Code
              </label>
              <input
                ref={codeInputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 1234"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-4 text-center font-mono text-3xl font-bold tracking-widest text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              {/* Notes */}
              <label className="mb-2 mt-5 block text-sm font-medium text-zinc-700">
                Notes{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Must purchase first"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-base text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              {submitError && (
                <p className="mt-3 text-sm text-red-500">{submitError}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!code.trim() || submitting}
                className="mt-5 w-full cursor-pointer rounded-xl bg-blue-600 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Location"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
