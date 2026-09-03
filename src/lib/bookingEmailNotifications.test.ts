import {
  buildAdminBookingEmail,
  buildCustomerBookingEmail,
  getMissingBookingEmailConfig,
} from "../../supabase/functions/_shared/booking-emails";
import {
  sanitizeCreateBookingPayload,
} from "../../supabase/functions/_shared/create-booking";
import type { BookingAvailabilityDay } from "./availability";
import {
  getTrustedBookingServices,
  getTrustedBookingTotal,
} from "./bookingServiceCatalog";

describe("trusted booking service catalog", () => {
  test("calculates trusted totals from the approved service list", () => {
    expect(
      getTrustedBookingTotal([
        "brake-pads-front-all",
        "brake-pads-rear-all",
      ]),
    ).toBe(149.7);
  });

  test("rejects duplicate service ids", () => {
    expect(() =>
      getTrustedBookingServices([
        "engine-oil-filter-replacement",
        "engine-oil-filter-replacement",
      ]),
    ).toThrow("Duplicate services are not allowed.");
  });
});

describe("server-side booking sanitization", () => {
  test("replaces customer-submitted pricing with trusted pricing", () => {
    const sanitized = sanitizeCreateBookingPayload(
      {
        full_name: "Ayyaz Ahmad",
        phone: "07123 456789",
        email: "AYYAZ@example.com",
        street_address_1: "12 Market Street",
        street_address_2: "",
        city: "London",
        postcode: "sw1a1aa",
        car_registration: "ab12 cde",
        make: "Toyota",
        model: "Yaris",
        fuel: "Petrol",
        engine: "1.5",
        year: "2022",
        vehicle_model_id: 123,
        selected_services: ["engine-oil-filter-replacement"],
        total_price: 1,
        availability: [
          {
            date: "2026-07-20",
            grouped_windows: ["morning"],
            exact_slots: [],
          },
        ],
        availability_note: "",
        work_notes: "Please ring on arrival.",
        vehicle_driveable: "yes",
      },
      "2026-07-14",
    );

    expect(sanitized.total_price).toBe(119.29);
    expect(sanitized.email).toBe("ayyaz@example.com");
    expect(sanitized.postcode).toBe("SW1A 1AA");
    expect(sanitized.car_registration).toBe("AB12CDE");
    expect(sanitized.vehicle_model_id).toBe(123);
  });

  test("rejects invalid customer email addresses", () => {
    expect(() =>
      sanitizeCreateBookingPayload(
        {
          full_name: "Ayyaz Ahmad",
          phone: "07123456789",
          email: "bad-email",
          street_address_1: "12 Market Street",
          city: "London",
          postcode: "SW1A 1AA",
          car_registration: "AB12CDE",
          selected_services: ["engine-oil-filter-replacement"],
          availability: [
            {
              date: "2026-07-20",
              grouped_windows: ["morning"],
              exact_slots: [],
            },
          ],
        },
        "2026-07-14",
      ),
    ).toThrow("Enter a valid email address.");
  });
});

describe("booking email templates", () => {
  const availability: BookingAvailabilityDay[] = [
    {
      date: "2026-07-20",
      grouped_windows: ["morning"],
      exact_slots: [],
    },
  ];
  const booking = {
    id: "booking-1",
    booking_number: "BKG-20260714-000021",
    full_name: `<script>alert("x")</script> Ayyaz`,
    phone: "07123456789",
    email: "customer@example.com",
    street_address_1: `12 <b>Market</b> Street`,
    street_address_2: null,
    city: "London",
    postcode: "SW1A 1AA",
    car_registration: "AB12CDE",
    make: "Toyota",
    model: "Yaris",
    fuel: "Petrol",
    engine: "1.5",
    year: "2022",
    vehicle_model_id: 123,
    vehicle_pricing_category: "small" as const,
    pricing_mapping_reason: "small_model_rule",
    pricing_source: "fixaroo" as const,
    quoted_price: 77,
    pricing_type: "estimated" as const,
    service_pricing_snapshot: [
      {
        pricing_type: "estimated" as const,
        quoted_price: 77,
        service_id: "engine-oil-filter-replacement",
        vehicle_model_id: 123,
        vehicle_pricing_category: "small" as const,
      },
    ],
    latitude: null,
    longitude: null,
    selected_services: ["engine-oil-filter-replacement"],
    availability,
    availability_note: `Gate code <1234>`,
    work_notes: `Please check <em>oil</em> leak`,
    vehicle_driveable: "yes" as const,
    total_price: 119.29,
    created_at: "2026-07-14T11:33:00.000Z",
  };

  test("escapes customer-controlled html in the customer email", () => {
    const email = buildCustomerBookingEmail({
      booking,
      publicWebsiteUrl: "https://stmmotors.com",
      websiteSource: "https://stmmotors.com",
    });

    expect(email.html).not.toContain("<script>alert");
    expect(email.html).toContain("&lt;script&gt;alert");
    expect(email.html).toContain("&lt;em&gt;oil&lt;/em&gt;");
    expect(email.text).toContain("BKG-20260714-000021");
  });

  test("builds the admin email with booking summary details", () => {
    const email = buildAdminBookingEmail({
      booking,
      publicWebsiteUrl: "https://stmmotors.com",
      websiteSource: "https://stmmotors.com",
    });

    expect(email.subject).toContain("New STM Motors Booking");
    expect(email.subject).toContain("Engine oil & filter replacement");
    expect(email.html).toContain("Estimated price: £77");
    expect(email.text).toContain("customer@example.com");
  });

  test("reports missing booking email configuration keys", () => {
    expect(
      getMissingBookingEmailConfig({
        resendApiKey: null,
        adminBookingEmail: "",
        bookingFromEmail: null,
        publicWebsiteUrl: "https://stmmotors.com",
      }),
    ).toEqual([
      "RESEND_API_KEY",
      "ADMIN_BOOKING_EMAIL",
      "BOOKING_FROM_EMAIL",
    ]);
  });
});
