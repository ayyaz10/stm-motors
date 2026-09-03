import { supabase } from "./supabase";
import { resolveBookingCoordinates } from "./bookingLocation";
import {
  normalizeAvailabilityDays,
  type BookingAvailabilityDay,
} from "./availability";

export interface BookingServicePricingSnapshot {
  labour_price?: number | null;
  parts_price?: number | null;
  pricing_type: "estimated" | "from";
  quoted_price: number;
  service_id: string;
  source?: "fixaroo" | "labour_only" | "supabase_fallback";
  vehicle_model_id: number | null;
  vehicle_pricing_category: "small" | "mid_size" | "suv_premium";
}

export interface BookingPayload {
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
}

export interface CreatedBooking {
  id: string;
  booking_number: string | null;
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
  service_pricing_snapshot: BookingServicePricingSnapshot[];
}

interface CreateBookingFunctionResponse {
  success?: boolean;
  error?: string;
  booking?: Partial<CreatedBooking>;
  emailStatus?: {
    admin: "sent" | "failed";
    customer: "sent" | "failed";
  };
}

export interface CreateBookingOptions {
  idempotencyKey?: string;
}

export function normalizeCreatedBooking(
  booking: Partial<CreatedBooking>,
): CreatedBooking {
  return {
    id: booking.id ?? "",
    booking_number: booking.booking_number ?? null,
    full_name: booking.full_name ?? "",
    email: booking.email ?? "",
    car_registration: booking.car_registration ?? "",
    created_at: booking.created_at ?? new Date().toISOString(),
    total_price: Number(booking.total_price ?? 0),
    selected_services: booking.selected_services ?? [],
    availability: normalizeAvailabilityDays(booking.availability ?? []),
    availability_note: booking.availability_note ?? null,
    work_notes: booking.work_notes ?? null,
    vehicle_driveable: booking.vehicle_driveable ?? null,
    vehicle_model_id: booking.vehicle_model_id ?? null,
    vehicle_pricing_category: booking.vehicle_pricing_category ?? null,
    pricing_mapping_reason: booking.pricing_mapping_reason ?? null,
    pricing_source: booking.pricing_source ?? null,
    quoted_price:
      typeof booking.quoted_price === "number"
        ? booking.quoted_price
        : booking.quoted_price === null
          ? null
          : Number(booking.quoted_price) || null,
    pricing_type: booking.pricing_type ?? null,
    service_pricing_snapshot: booking.service_pricing_snapshot ?? [],
  };
}

export async function createBooking(
  payload: BookingPayload,
  options: CreateBookingOptions = {},
): Promise<CreatedBooking> {
  const normalizedAvailability = normalizeAvailabilityDays(payload.availability);

  if (normalizedAvailability.length === 0) {
    throw new Error("Select at least one date and availability window.");
  }

  const coordinates = await resolveBookingCoordinates({
    street_address_1: payload.street_address_1,
    street_address_2: payload.street_address_2,
    city: payload.city,
    postcode: payload.postcode,
  });

  const idempotencyKey =
    options.idempotencyKey ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `booking-${Date.now()}`);
  const { data, error } = await supabase.functions.invoke("create-booking", {
    body: {
      idempotencyKey,
      booking: {
        ...payload,
        total_price: payload.total_price,
        availability: normalizedAvailability,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        geocoded_at: coordinates.geocodedAt,
      },
    },
  });

  if (error) {
    const responseContext = (error as { context?: Response }).context;

    if (responseContext) {
      try {
        const result = (await responseContext
          .clone()
          .json()) as CreateBookingFunctionResponse;

        if (result?.error) {
          throw new Error(result.error);
        }
      } catch {
        // Fall through to the generic error below when the response body is unavailable.
      }
    }

    throw new Error(error.message || "Failed to create booking");
  }

  if (!data) {
    throw new Error("Failed to create booking");
  }

  const result = data as CreateBookingFunctionResponse;

  if (!result.success || !result.booking) {
    throw new Error(result.error || "Failed to create booking");
  }

  if (
    result.emailStatus &&
    (result.emailStatus.admin === "failed" ||
      result.emailStatus.customer === "failed")
  ) {
    console.warn("Booking saved but one or more email notifications failed.", {
      emailStatus: result.emailStatus,
    });
  }

  return normalizeCreatedBooking(result.booking);
}
