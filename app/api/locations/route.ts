import { NextResponse } from "next/server";
import { db } from "@/db";
import { locations, codes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.query.locations.findMany({
    with: { codes: true },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { name, address, code, lat, lng, notes, placeId } = await request.json();

  if (!name || !address || !code || lat == null || lng == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find or create the location
  let locationId: number;

  if (placeId) {
    const existing = await db
      .select()
      .from(locations)
      .where(eq(locations.googlePlaceId, placeId))
      .limit(1);

    if (existing.length > 0) {
      locationId = existing[0].id;
    } else {
      const [loc] = await db
        .insert(locations)
        .values({ googlePlaceId: placeId, name, address, lat, lng })
        .returning();
      locationId = loc.id;
    }
  } else {
    const [loc] = await db
      .insert(locations)
      .values({ name, address, lat, lng })
      .returning();
    locationId = loc.id;
  }

  const [newCode] = await db
    .insert(codes)
    .values({ locationId, code, notes: notes ?? null })
    .returning();

  return NextResponse.json(newCode, { status: 201 });
}
