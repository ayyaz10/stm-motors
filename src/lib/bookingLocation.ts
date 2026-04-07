import { supabase } from "./supabase";

export interface BookingLocationAddress {
  street_address_1: string;
  street_address_2: string | null;
  city: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
}

interface BookingLocationRow extends BookingLocationAddress {
  id: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
}

interface PostcodesIoResponse {
  status: number;
  result: {
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface EnsuredBookingCoordinates {
  latitude: number | null;
  longitude: number | null;
  source: "stored" | "geocoded" | "missing";
}

export interface ResolvedBookingCoordinates {
  latitude: number | null;
  longitude: number | null;
  geocodedAt: string | null;
}

function isFiniteCoordinate(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function buildBookingAddressParts(
  address: Pick<
    BookingLocationAddress,
    "street_address_1" | "street_address_2" | "city" | "postcode"
  >,
): string[] {
  return [
    address.street_address_1,
    address.street_address_2,
    address.city,
    address.postcode,
  ].filter((part): part is string => Boolean(part?.trim()));
}

export function buildBookingAddressLine(
  address: Pick<
    BookingLocationAddress,
    "street_address_1" | "street_address_2" | "city" | "postcode"
  >,
): string {
  return buildBookingAddressParts(address).join(", ");
}

export function buildGoogleMapsUrl(
  address: Pick<
    BookingLocationAddress,
    | "street_address_1"
    | "street_address_2"
    | "city"
    | "postcode"
    | "latitude"
    | "longitude"
  >,
): string {
  if (
    isFiniteCoordinate(address.latitude) &&
    isFiniteCoordinate(address.longitude)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildBookingAddressLine(address))}`;
}

async function geocodeQuery(query: string): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=gb&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Geocoding request failed.");
  }

  const results = (await response.json()) as NominatimSearchResult[];
  const firstResult = results[0];

  if (!firstResult) {
    return null;
  }

  const latitude = Number(firstResult.lat);
  const longitude = Number(firstResult.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

async function geocodePostcode(postcode: string): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const cleanedPostcode = postcode.trim();

  if (!cleanedPostcode) {
    return null;
  }

  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanedPostcode)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Postcode geocoding request failed.");
  }

  const data = (await response.json()) as PostcodesIoResponse;

  if (
    data.status !== 200 ||
    !data.result ||
    !Number.isFinite(data.result.latitude) ||
    !Number.isFinite(data.result.longitude)
  ) {
    return null;
  }

  const latitude = data.result.latitude;
  const longitude = data.result.longitude;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

async function geocodeBookingAddress(
  address: Pick<
    BookingLocationAddress,
    "street_address_1" | "street_address_2" | "city" | "postcode"
  >,
): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const primaryQuery = `${buildBookingAddressLine(address)}, United Kingdom`;
  const fallbackQuery = [address.postcode, address.city, "United Kingdom"]
    .filter(Boolean)
    .join(", ");

  const queries = [primaryQuery, fallbackQuery].filter(
    (query, index, collection) => query.trim() && collection.indexOf(query) === index,
  );

  for (const query of queries) {
    try {
      const result = await geocodeQuery(query);

      if (result) {
        return result;
      }
    } catch (error) {
      console.error("Address geocoding failed for query", query, error);
    }
  }

  try {
    return await geocodePostcode(address.postcode);
  } catch (error) {
    console.error("Postcode geocoding failed", address.postcode, error);
    return null;
  }
}

export async function resolveBookingCoordinates(
  address: Pick<
    BookingLocationAddress,
    "street_address_1" | "street_address_2" | "city" | "postcode"
  >,
): Promise<ResolvedBookingCoordinates> {
  const coordinates = await geocodeBookingAddress(address);

  if (!coordinates) {
    return {
      latitude: null,
      longitude: null,
      geocodedAt: null,
    };
  }

  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    geocodedAt: new Date().toISOString(),
  };
}

async function fetchBookingLocationRow(
  bookingId: string,
): Promise<BookingLocationRow> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, street_address_1, street_address_2, city, postcode, latitude, longitude",
    )
    .eq("id", bookingId)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to load booking location.");
  }

  return {
    id: data.id,
    street_address_1: data.street_address_1,
    street_address_2: data.street_address_2,
    city: data.city,
    postcode: data.postcode,
    latitude:
      typeof data.latitude === "number" ? data.latitude : Number(data.latitude) || null,
    longitude:
      typeof data.longitude === "number"
        ? data.longitude
        : Number(data.longitude) || null,
  };
}

async function saveBookingCoordinates(
  bookingId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const { error } = await supabase.rpc("save_booking_coordinates", {
    p_booking_id: bookingId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_geocoded_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || "Failed to save booking coordinates.");
  }
}

export async function ensureBookingCoordinates(
  bookingId: string,
): Promise<EnsuredBookingCoordinates> {
  const booking = await fetchBookingLocationRow(bookingId);

  if (
    isFiniteCoordinate(booking.latitude) &&
    isFiniteCoordinate(booking.longitude)
  ) {
    return {
      latitude: booking.latitude,
      longitude: booking.longitude,
      source: "stored",
    };
  }

  const geocodedCoordinates = await geocodeBookingAddress(booking);

  if (!geocodedCoordinates) {
    return {
      latitude: null,
      longitude: null,
      source: "missing",
    };
  }

  await saveBookingCoordinates(
    bookingId,
    geocodedCoordinates.latitude,
    geocodedCoordinates.longitude,
  );

  return {
    latitude: geocodedCoordinates.latitude,
    longitude: geocodedCoordinates.longitude,
    source: "geocoded",
  };
}
