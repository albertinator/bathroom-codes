import { pgTable, serial, text, doublePrecision, timestamp, integer } from "drizzle-orm/pg-core";
import { InferSelectModel, relations } from "drizzle-orm";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  googlePlaceId: text("google_place_id").unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
});

export const codes = pgTable("codes", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().references(() => locations.id),
  code: text("code").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  codes: many(codes),
}));

export const codesRelations = relations(codes, ({ one }) => ({
  location: one(locations, {
    fields: [codes.locationId],
    references: [locations.id],
  }),
}));

export type Location = InferSelectModel<typeof locations>;
export type Code = InferSelectModel<typeof codes>;
