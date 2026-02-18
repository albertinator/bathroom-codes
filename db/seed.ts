import "dotenv/config";
import { db } from "./index";
import { locations } from "./schema";

const seedData = [
  {
    name: "Best Buy",
    address: "14 Allstate Rd, Dorchester, MA 02125",
    code: "13579#",
    lat: 42.3468,
    lng: -71.0545,
  },
  {
    name: "Tatte Bakery & Cafe",
    address: "60 Old Colony Ave, Boston, MA 02127",
    code: "12345",
    lat: 42.3375,
    lng: -71.0503,
  },
  {
    name: "Panera Bread",
    address: "8 Allstate Rd Suite 3, Dorchester, MA 02125",
    code: "4589",
    lat: 42.3465,
    lng: -71.054,
  },
  {
    name: "Raising Cane's",
    address: "782 S Willow St, Manchester, NH 03103",
    code: "2060",
    lat: 42.9634,
    lng: -71.4618,
  },
];

async function seed() {
  console.log("Truncating locations table...");
  await db.delete(locations);

  console.log("Inserting seed data...");
  await db.insert(locations).values(seedData);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
