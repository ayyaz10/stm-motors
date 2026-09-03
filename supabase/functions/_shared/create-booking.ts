import {
  normalizeAvailabilityDays,
  type BookingAvailabilityDay,
} from "../../../src/lib/availability.ts";
import {
  getTrustedBookingServices,
  getTrustedBookingTotal,
} from "../../../src/lib/bookingServiceCatalog.ts";

export type BookingEmailDeliveryStatus = "sent" | "failed";

export interface IncomingCreateBookingRequest {
  idempotencyKey?: unknown;
  booking?: unknown;
}

export interface IncomingBookingPayload {
  full_name?: unknown;
  phone?: unknown;
  email?: unknown;
  street_address_1?: unknown;
  street_address_2?: unknown;
  city?: unknown;
  postcode?: unknown;
  car_registration?: unknown;
  make?: unknown;
  model?: unknown;
  fuel?: unknown;
  engine?: unknown;
  year?: unknown;
  vehicle_model_id?: unknown;
  selected_services?: unknown;
  total_price?: unknown;
  availability?: unknown;
  availability_note?: unknown;
  work_notes?: unknown;
  vehicle_driveable?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  geocoded_at?: unknown;
}

export interface SanitizedBookingPayload {
  full_name: string;
  phone: string;
  email: string;
  street_address_1: string;
  street_address_2: string | null;
  city: string;
  postcode: string;
  car_registration: string;
  make: string | null;
  model: string | null;
  fuel: string | null;
  engine: string | null;
  year: string | null;
  vehicle_model_id: number | null;
  selected_services: string[];
  total_price: number;
  availability: BookingAvailabilityDay[];
  availability_note: string | null;
  work_notes: string | null;
  vehicle_driveable: "yes" | "no" | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_at: string | null;
}

export interface BookingRecord {
  id: string;
  booking_number: string;
  full_name: string;
  phone: string;
  email: string;
  street_address_1: string;
  street_address_2: string | null;
  city: string;
  postcode: string;
  car_registration: string;
  make: string | null;
  model: string | null;
  fuel: string | null;
  engine: string | null;
  year: string | null;
  vehicle_model_id: number | null;
  vehicle_pricing_category: "small" | "mid_size" | "suv_premium" | null;
  pricing_mapping_reason: string | null;
  pricing_source: "fixaroo" | "mixed" | "supabase_fallback" | null;
  quoted_price: number | null;
  pricing_type: "estimated" | "from" | null;
  service_pricing_snapshot: Array<{
    pricing_type: "estimated" | "from";
    quoted_price: number;
    service_id: string;
    vehicle_model_id: number | null;
    vehicle_pricing_category: "small" | "mid_size" | "suv_premium";
    labour_price?: number | null;
    parts?: Array<{
      brand: string | null;
      id: string;
      name: string;
      partNumber: string | null;
      quantity: number;
      unitPrice: number;
    }>;
    parts_price?: number | null;
    source?: "fixaroo" | "labour_only" | "supabase_fallback";
  }>;
  latitude: number | null;
  longitude: number | null;
  selected_services: string[];
  availability: BookingAvailabilityDay[];
  availability_note: string | null;
  work_notes: string | null;
  vehicle_driveable: "yes" | "no" | null;
  total_price: number;
  created_at: string;
}

export interface BookingSubmissionRequestRecord {
  id: string;
  idempotency_key: string;
  request_hash: string;
  booking_id: string | null;
  status: "processing" | "created" | "failed";
  error_code: string | null;
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingEmailNotificationRecord {
  id: string;
  booking_id: string;
  email_type: "admin" | "customer";
  recipient_email: string;
  status: "pending" | "sent" | "failed";
  resend_message_id: string | null;
  last_attempted_at: string | null;
  failure_reason: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingSuccessResponse {
  success: true;
  bookingId: string;
  bookingNumber: string;
  booking: {
    id: string;
    booking_number: string;
    full_name: string;
    email: string;
    car_registration: string;
    created_at: string;
    total_price: number;
    selected_services: string[];
    availability: BookingAvailabilityDay[];
    availability_note: string | null;
    work_notes: string | null;
    vehicle_driveable: "yes" | "no" | null;
    vehicle_model_id: number | null;
    vehicle_pricing_category: "small" | "mid_size" | "suv_premium" | null;
    pricing_mapping_reason: string | null;
    pricing_source: "fixaroo" | "mixed" | "supabase_fallback" | null;
    quoted_price: number | null;
    pricing_type: "estimated" | "from" | null;
    service_pricing_snapshot: BookingRecord["service_pricing_snapshot"];
  };
  emailStatus: {
    admin: BookingEmailDeliveryStatus;
    customer: BookingEmailDeliveryStatus;
  };
}

export const BOOKING_SELECT_COLUMNS =
  "id, booking_number, full_name, phone, email, street_address_1, street_address_2, city, postcode, car_registration, make, model, fuel, engine, year, vehicle_model_id, vehicle_pricing_category, pricing_mapping_reason, pricing_source, quoted_price, pricing_type, service_pricing_snapshot, latitude, longitude, selected_services, availability, availability_note, work_notes, vehicle_driveable, total_price, created_at";

export const BOOKING_NOTIFICATION_STALE_MS = 2 * 60 * 1000;

const INVALID_FIRST_POSTCODE_CHARS = ["Q", "V", "X"] as const;
const INVALID_INWARD_POSTCODE_CHARS = /[CIJKMPQVXYZ]/;
const POSTCODE_SPECIAL_CASE = "GIR0AA";
const POSTCODE_PATTERNS = [
  /^[A-Z][0-9][0-9]?[0-9]?[A-Z]{2}$/,
  /^[A-Z]{2}[0-9][0-9]?[0-9]?[A-Z]{2}$/,
  /^[A-Z][0-9][A-Z][0-9][A-Z]{2}$/,
  /^[A-Z]{2}[0-9][A-Z][0-9][A-Z]{2}$/,
] as const;

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizePostcode(value: string): string {
  const normalized = value.replace(/\s+/g, "").toUpperCase();

  if (normalized.length < 5) {
    return normalized;
  }

  return `${normalized.slice(0, -3)} ${normalized.slice(-3)}`;
}

export function validateUkPostcode(postcode: string): boolean {
  const normalized = postcode.replace(/\s+/g, "").toUpperCase();

  if (normalized.length < 5 || normalized.length > 7) {
    return false;
  }

  if (normalized === POSTCODE_SPECIAL_CASE) {
    return true;
  }

  const hasValidFormat = POSTCODE_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );

  if (!hasValidFormat) {
    return false;
  }

  const firstChar = normalized[0];

  if (
    INVALID_FIRST_POSTCODE_CHARS.includes(
      firstChar as (typeof INVALID_FIRST_POSTCODE_CHARS)[number],
    )
  ) {
    return false;
  }

  return !INVALID_INWARD_POSTCODE_CHARS.test(normalized.slice(-3));
}

function expectString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required.`);
  }

  return value;
}

function normalizeOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = normalizeSpaces(String(value));

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} is too long.`);
  }

  return normalized;
}

function sanitizeName(value: unknown): string {
  const normalized = normalizeSpaces(expectString(value, "Full name"));

  if (!normalized) {
    throw new Error("Full name is required.");
  }

  if (normalized.length < 2) {
    throw new Error("Full name is too short.");
  }

  if (normalized.length > 60) {
    throw new Error("Full name is too long.");
  }

  if (!/^[a-zA-Z\s'-]+$/.test(normalized)) {
    throw new Error("Enter a valid full name.");
  }

  return normalized;
}

function sanitizePhone(value: unknown): string {
  const normalized = expectString(value, "Phone number")
    .replace(/\s+/g, "")
    .trim();

  if (!normalized) {
    throw new Error("Phone number is required.");
  }

  if (!/^\+?[0-9]{10,15}$/.test(normalized)) {
    throw new Error("Enter a valid phone number.");
  }

  return normalized;
}

function sanitizeEmail(value: unknown): string {
  const normalized = expectString(value, "Email address")
    .trim()
    .toLowerCase();

  if (!normalized) {
    throw new Error("Email address is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }

  return normalized;
}

function sanitizeStreetAddress(value: unknown): string {
  const normalized = normalizeSpaces(expectString(value, "Street address"));

  if (!normalized) {
    throw new Error("Street address is required.");
  }

  if (normalized.length < 5) {
    throw new Error("Enter a fuller street address.");
  }

  if (normalized.length > 100) {
    throw new Error("Street address is too long.");
  }

  return normalized;
}

function sanitizeCity(value: unknown): string {
  const normalized = normalizeSpaces(expectString(value, "City"));

  if (!normalized) {
    throw new Error("City is required.");
  }

  if (normalized.length < 2) {
    throw new Error("City is too short.");
  }

  if (normalized.length > 50) {
    throw new Error("City is too long.");
  }

  if (!/^[a-zA-Z\s'-]+$/.test(normalized)) {
    throw new Error("Enter a valid city.");
  }

  return normalized;
}

function sanitizePostcode(value: unknown): string {
  const normalized = normalizePostcode(expectString(value, "Postcode"));

  if (!normalized) {
    throw new Error("Postcode is required.");
  }

  if (!validateUkPostcode(normalized)) {
    throw new Error("Enter a valid postcode.");
  }

  return normalized;
}

function sanitizeRegistration(value: unknown): string {
  const normalized = expectString(value, "Vehicle registration")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error("Vehicle registration is required.");
  }

  if (normalized.length < 2 || normalized.length > 10) {
    throw new Error("Enter a valid registration number.");
  }

  if (!/^[A-Z0-9]+$/.test(normalized)) {
    throw new Error("Enter a valid registration number.");
  }

  return normalized;
}

function sanitizeVehicleDriveable(value: unknown): "yes" | "no" | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value !== "yes" && value !== "no") {
    throw new Error("Vehicle driveable must be yes or no.");
  }

  return value;
}

function sanitizeVehicleModelId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const vehicleModelId = Number(value);

  if (!Number.isSafeInteger(vehicleModelId) || vehicleModelId <= 0) {
    throw new Error("Vehicle model id is invalid.");
  }

  return vehicleModelId;
}

function sanitizeCoordinates(
  latitudeValue: unknown,
  longitudeValue: unknown,
  geocodedAtValue: unknown,
): Pick<SanitizedBookingPayload, "latitude" | "longitude" | "geocoded_at"> {
  const latitude =
    typeof latitudeValue === "number"
      ? latitudeValue
      : latitudeValue === null || latitudeValue === undefined || latitudeValue === ""
        ? null
        : Number(latitudeValue);
  const longitude =
    typeof longitudeValue === "number"
      ? longitudeValue
      : longitudeValue === null || longitudeValue === undefined || longitudeValue === ""
        ? null
        : Number(longitudeValue);

  if (latitude === null && longitude === null) {
    return {
      latitude: null,
      longitude: null,
      geocoded_at: null,
    };
  }

  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error("Location coordinates must be valid numbers.");
  }

  const safeLatitude = latitude;
  const safeLongitude = longitude;

  if (safeLatitude < -90 || safeLatitude > 90) {
    throw new Error("Latitude is out of range.");
  }

  if (safeLongitude < -180 || safeLongitude > 180) {
    throw new Error("Longitude is out of range.");
  }

  let geocodedAt: string | null = null;

  if (typeof geocodedAtValue === "string" && geocodedAtValue.trim()) {
    const parsedTimestamp = Date.parse(geocodedAtValue);

    if (Number.isNaN(parsedTimestamp)) {
      throw new Error("Geocoded timestamp is invalid.");
    }

    geocodedAt = new Date(parsedTimestamp).toISOString();
  }

  return {
    latitude: safeLatitude,
    longitude: safeLongitude,
    geocoded_at: geocodedAt,
  };
}

function sanitizeAvailability(
  value: unknown,
  minDate: string,
): BookingAvailabilityDay[] {
  const normalized = normalizeAvailabilityDays(
    Array.isArray(value) ? (value as BookingAvailabilityDay[]) : [],
    { minDate },
  );

  if (normalized.length === 0) {
    throw new Error("Select at least one date and availability window.");
  }

  return normalized;
}

function sanitizeSelectedServices(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Select at least one valid service.");
  }

  return getTrustedBookingServices(
    value.filter((serviceId): serviceId is string => typeof serviceId === "string"),
  ).map((service) => service.id);
}

export function getLondonDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(date);
}

export function sanitizeCreateBookingPayload(
  payload: IncomingBookingPayload,
  minDate = getLondonDateKey(),
): SanitizedBookingPayload {
  const selectedServices = sanitizeSelectedServices(payload.selected_services);

  return {
    full_name: sanitizeName(payload.full_name),
    phone: sanitizePhone(payload.phone),
    email: sanitizeEmail(payload.email),
    street_address_1: sanitizeStreetAddress(payload.street_address_1),
    street_address_2: normalizeOptionalText(
      payload.street_address_2,
      "Street address 2",
      100,
    ),
    city: sanitizeCity(payload.city),
    postcode: sanitizePostcode(payload.postcode),
    car_registration: sanitizeRegistration(payload.car_registration),
    make: normalizeOptionalText(payload.make, "Vehicle make", 80),
    model: normalizeOptionalText(payload.model, "Vehicle model", 80),
    fuel: normalizeOptionalText(payload.fuel, "Fuel type", 80),
    engine: normalizeOptionalText(payload.engine, "Engine details", 80),
    year: normalizeOptionalText(payload.year, "Vehicle year", 10),
    vehicle_model_id: sanitizeVehicleModelId(payload.vehicle_model_id),
    selected_services: selectedServices,
    total_price: getTrustedBookingTotal(selectedServices),
    availability: sanitizeAvailability(payload.availability, minDate),
    availability_note: normalizeOptionalText(
      payload.availability_note,
      "Availability note",
      500,
    ),
    work_notes: normalizeOptionalText(payload.work_notes, "Work notes", 2000),
    vehicle_driveable: sanitizeVehicleDriveable(payload.vehicle_driveable),
    ...sanitizeCoordinates(
      payload.latitude,
      payload.longitude,
      payload.geocoded_at,
    ),
  };
}

export function sanitizeIdempotencyKey(value: unknown): string {
  const normalized =
    typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new Error("Idempotency key is required.");
  }

  if (normalized.length < 8 || normalized.length > 160) {
    throw new Error("Idempotency key is invalid.");
  }

  if (!/^[A-Za-z0-9:_-]+$/.test(normalized)) {
    throw new Error("Idempotency key is invalid.");
  }

  return normalized;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([leftKey], [rightKey]) => leftKey.localeCompare(rightKey),
    );

    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export async function buildBookingRequestHash(
  payload: SanitizedBookingPayload,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(stableSerialize(payload)),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function toCreatedBookingResponse(
  booking: BookingRecord,
  emailStatus: CreateBookingSuccessResponse["emailStatus"],
): CreateBookingSuccessResponse {
  return {
    success: true,
    bookingId: booking.id,
    bookingNumber: booking.booking_number,
    booking: {
      id: booking.id,
      booking_number: booking.booking_number,
      full_name: booking.full_name,
      email: booking.email,
      car_registration: booking.car_registration,
      created_at: booking.created_at,
      total_price: Number(booking.total_price),
      selected_services: booking.selected_services,
      availability: booking.availability,
      availability_note: booking.availability_note,
      work_notes: booking.work_notes,
      vehicle_driveable: booking.vehicle_driveable,
      vehicle_model_id: booking.vehicle_model_id,
      vehicle_pricing_category: booking.vehicle_pricing_category,
      pricing_mapping_reason: booking.pricing_mapping_reason,
      pricing_source: booking.pricing_source,
      quoted_price:
        booking.quoted_price === null ? null : Number(booking.quoted_price),
      pricing_type: booking.pricing_type,
      service_pricing_snapshot: booking.service_pricing_snapshot ?? [],
    },
    emailStatus,
  };
}
