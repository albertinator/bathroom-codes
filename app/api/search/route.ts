import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!q) return NextResponse.json([]);

  const params = new URLSearchParams({ q, limit: "8", lang: "en" });
  if (lat && lng) {
    params.set("lat", lat);
    params.set("lon", lng);
  }

  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { "User-Agent": "BathroomCodes/1.0" },
  });

  if (!res.ok) return NextResponse.json([]);

  const data = await res.json();

  type PhotonFeature = {
    geometry: { coordinates: [number, number] };
    properties: Record<string, string | number | undefined>;
  };

  const results = (data.features ?? [])
    .map((f: PhotonFeature) => {
      const p = f.properties;
      if (!p.name) return null;
      const streetPart = p.housenumber
        ? `${p.housenumber} ${p.street}`
        : p.street;
      const addressParts = [
        streetPart,
        p.city || p.town || p.village,
        p.state,
        p.postcode,
      ].filter(Boolean);
      return {
        name: String(p.name),
        address: addressParts.join(", "),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    })
    .filter(Boolean);

  return NextResponse.json(results);
}
