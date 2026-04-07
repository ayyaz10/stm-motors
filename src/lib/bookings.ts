import { supabase } from "./supabase";

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
  selected_services: string[];
  total_price: number;
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
}

export async function createBooking(
  payload: BookingPayload,
): Promise<CreatedBooking> {
  const { data, error } = await supabase.rpc("create_public_booking", {
    p_full_name: payload.full_name,
    p_phone: payload.phone,
    p_email: payload.email,
    p_street_address_1: payload.street_address_1,
    p_street_address_2: payload.street_address_2,
    p_city: payload.city,
    p_postcode: payload.postcode,
    p_car_registration: payload.car_registration,
    p_make: payload.make,
    p_model: payload.model,
    p_fuel: payload.fuel,
    p_engine: payload.engine,
    p_year: payload.year,
    p_selected_services: payload.selected_services,
    p_total_price: payload.total_price,
  });

  if (error) {
    throw new Error(error.message || "Failed to create booking");
  }

  if (!data) {
    throw new Error("Failed to create booking");
  }

  return data as CreatedBooking;
}
