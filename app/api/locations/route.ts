import { NextResponse } from "next/server";
import { db } from "@/db";
import { locations } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(locations);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { name, address, code, lat, lng, notes } = await request.json();

  if (!name || !address || !code || lat == null || lng == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [location] = await db
    .insert(locations)
    .values({ name, address, code, lat, lng, notes: notes ?? null })
    .returning();

  return NextResponse.json(location, { status: 201 });
}
