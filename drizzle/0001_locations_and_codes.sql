-- Step 1: Create codes table, referencing existing locations ids
CREATE TABLE "codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"code" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Step 2: Migrate existing codes out of locations into the new codes table
INSERT INTO "codes" ("location_id", "code", "notes", "created_at")
SELECT "id", "code", "notes", "created_at" FROM "locations";
--> statement-breakpoint

-- Step 3: Add FK constraint now that data is in place
ALTER TABLE "codes" ADD CONSTRAINT "codes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Step 4: Remove code/notes/created_at from locations (now live in codes)
ALTER TABLE "locations" DROP COLUMN "code";
--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "notes";
--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "created_at";
--> statement-breakpoint

-- Step 5: Add google_place_id to locations
ALTER TABLE "locations" ADD COLUMN "google_place_id" text;
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_google_place_id_unique" UNIQUE("google_place_id");
