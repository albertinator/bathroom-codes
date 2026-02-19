import "dotenv/config";
import { db } from "./index";
import { locations, codes } from "./schema";

const seedData = [
  {
    location: {
      googlePlaceId: "ChIJfRFJT1t644kRQ95GwB0Hlvc",
      name: "Best Buy",
      address: "14 Allstate Rd, Dorchester, MA 02125",
      lat: 42.3468,
      lng: -71.0545,
    },
    code: "13579#",
  },
  {
    location: {
      googlePlaceId: "ChIJnb1lWXx744kRDNZpnMIxJx0",
      name: "Tatte Bakery & Cafe",
      address: "60 Old Colony Ave, Boston, MA 02127",
      lat: 42.3375,
      lng: -71.0503,
    },
    code: "12345",
  },
  {
    location: {
      googlePlaceId: "ChIJRUmvJ0V644kRXXGWeFeWFBk",
      name: "Panera Bread",
      address: "8 Allstate Rd Suite 3, Dorchester, MA 02125",
      lat: 42.3465,
      lng: -71.054,
    },
    code: "4589",
  },
  {
    location: {
      googlePlaceId: "ChIJ5ZBJe41P4okRgBxJixNfDE8",
      name: "Raising Cane's",
      address: "782 S Willow St, Manchester, NH 03103",
      lat: 42.9634,
      lng: -71.4618,
    },
    code: "2060",
  },
];

async function seed() {
  console.log("Truncating tables...");
  await db.delete(codes);
  await db.delete(locations);

  console.log("Inserting seed data...");
  for (const row of seedData) {
    const [loc] = await db.insert(locations).values(row.location).returning();
    await db.insert(codes).values({ locationId: loc.id, code: row.code });
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
