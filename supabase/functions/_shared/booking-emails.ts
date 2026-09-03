import {
  formatAvailabilityDate,
  formatAvailabilityDaySummary,
} from "../../../src/lib/availability.ts";
import { getTrustedBookingServices } from "../../../src/lib/bookingServiceCatalog.ts";
import type {
  BookingRecord,
  SanitizedBookingPayload,
} from "./create-booking.ts";

export interface BookingEmailConfig {
  adminBookingEmail: string | null;
  bookingFromEmail: string | null;
  publicWebsiteUrl: string | null;
  resendApiKey: string | null;
}

interface BookingEmailContext {
  booking: BookingRecord;
  publicWebsiteUrl: string;
  websiteSource: string | null;
}

export interface PreparedBookingEmail {
  subject: string;
  html: string;
  text: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  dateStyle: "medium",
  timeStyle: "short",
});

function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value : "Not provided";
}

function getServiceNames(serviceIds: string[]): string[] {
  return getTrustedBookingServices(serviceIds).map((service) => service.name);
}

function buildServiceSubjectLabel(serviceIds: string[]): string {
  const serviceNames = getServiceNames(serviceIds);
  const firstService = serviceNames[0] ?? "Service";

  if (serviceNames.length <= 1) {
    return firstService;
  }

  return `${firstService} +${serviceNames.length - 1} more`;
}

function formatBookingPricing(booking: BookingRecord): string {
  const price = Number(booking.quoted_price ?? booking.total_price);
  const formattedPrice = Number.isInteger(price)
    ? `£${price.toFixed(0)}`
    : `£${price.toFixed(2)}`;

  return booking.pricing_type === "from"
    ? `From ${formattedPrice}`
    : formattedPrice;
}

function buildVehicleLabel(booking: BookingRecord): string {
  const details = [booking.make, booking.model, booking.year]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  return details || "Vehicle details to be confirmed";
}

function buildAddressLines(booking: BookingRecord): string[] {
  return [
    booking.street_address_1,
    booking.street_address_2,
    booking.city,
    booking.postcode,
  ].filter((line): line is string => Boolean(line?.trim()));
}

function buildAvailabilityLines(
  availability: SanitizedBookingPayload["availability"],
): string[] {
  if (availability.length === 0) {
    return ["No availability provided"];
  }

  return availability.map(
    (day) =>
      `${formatAvailabilityDate(day.date)} - ${formatAvailabilityDaySummary(day)}`,
  );
}

function formatDriveableValue(
  value: BookingRecord["vehicle_driveable"],
): string {
  if (value === "yes") {
    return "Yes";
  }

  if (value === "no") {
    return "No";
  }

  return "Not specified";
}

function formatSubmittedAt(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function customerFirstName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0];

  return firstName || "there";
}

function sectionCard(
  heading: string,
  content: string,
  background = "#ffffff",
): string {
  return `
    <tr>
      <td style="padding: 0 0 16px;">
        <div style="border: 1px solid #d9e5fb; border-radius: 18px; padding: 20px; background: ${background};">
          <div style="font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #1c69d4; margin-bottom: 10px;">
            ${escapeHtml(heading)}
          </div>
          ${content}
        </div>
      </td>
    </tr>
  `;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getMissingBookingEmailConfig(
  config: BookingEmailConfig,
): string[] {
  const missing: string[] = [];

  if (!config.resendApiKey?.trim()) {
    missing.push("RESEND_API_KEY");
  }

  if (!config.adminBookingEmail?.trim()) {
    missing.push("ADMIN_BOOKING_EMAIL");
  }

  if (!config.bookingFromEmail?.trim()) {
    missing.push("BOOKING_FROM_EMAIL");
  }

  if (!config.publicWebsiteUrl?.trim()) {
    missing.push("PUBLIC_WEBSITE_URL");
  }

  return missing;
}

export function buildAdminBookingEmail(
  context: BookingEmailContext,
): PreparedBookingEmail {
  const { booking, publicWebsiteUrl, websiteSource } = context;
  const availabilityLines = buildAvailabilityLines(booking.availability);
  const serviceNames = getServiceNames(booking.selected_services);
  const addressLines = buildAddressLines(booking);
  const pricingDisplayLabel = formatBookingPricing(booking);
  const subject = `New STM Motors Booking - ${buildServiceSubjectLabel(booking.selected_services)} - ${booking.full_name}`;

  const html = `
    <!doctype html>
    <html lang="en">
      <body style="margin: 0; padding: 0; background: #f4f8ff; font-family: Arial, Helvetica, sans-serif; color: #0b1730;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f4f8ff; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 720px; background: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #d9e5fb;">
                <tr>
                  <td style="padding: 28px 28px 20px; background: #1c69d4; color: #ffffff;">
                    <div style="font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.76);">
                      STM Motors
                    </div>
                    <h1 style="margin: 12px 0 10px; font-size: 32px; line-height: 1.15; font-weight: 700; color: #ffffff;">
                      New booking received
                    </h1>
                    <p style="margin: 0; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.88);">
                      A new customer booking has been submitted on ${escapeHtml(websiteSource ?? publicWebsiteUrl)}.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 28px 12px;">
                    ${sectionCard(
                      "Booking summary",
                      `
                        <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; font-weight: 700; color: #0b1730;">${escapeHtml(booking.booking_number)}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #50627e;">Submitted ${escapeHtml(formatSubmittedAt(booking.created_at))}</p>
                      `,
                      "#f8fbff",
                    )}
                    ${sectionCard(
                      "Customer",
                      `
                        <p style="margin: 0 0 8px; font-size: 18px; line-height: 1.5; font-weight: 700; color: #0b1730;">${escapeHtml(booking.full_name)}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #23324f;">Email: ${escapeHtml(booking.email)}<br />Phone: ${escapeHtml(booking.phone)}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Vehicle & service",
                      `
                        <p style="margin: 0 0 8px; font-size: 18px; line-height: 1.5; font-weight: 700; color: #0b1730;">${escapeHtml(booking.car_registration)}</p>
                        <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.8; color: #23324f;">${escapeHtml(buildVehicleLabel(booking))}</p>
                        <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.6; color: #50627e;">Selected service${serviceNames.length === 1 ? "" : "s"}</p>
                        <ul style="margin: 0 0 14px 18px; padding: 0; color: #23324f;">
                          ${serviceNames
                            .map(
                              (serviceName) =>
                                `<li style="margin-bottom: 6px; font-size: 15px; line-height: 1.6;">${escapeHtml(serviceName)}</li>`,
                            )
                            .join("")}
                        </ul>
                        <p style="margin: 0; font-size: 16px; line-height: 1.7; font-weight: 700; color: #0b1730;">Estimated price: ${escapeHtml(pricingDisplayLabel)}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Availability submitted",
                      `
                        <ul style="margin: 0 0 12px 18px; padding: 0; color: #23324f;">
                          ${availabilityLines
                            .map(
                              (line) =>
                                `<li style="margin-bottom: 6px; font-size: 15px; line-height: 1.6;">${escapeHtml(line)}</li>`,
                            )
                            .join("")}
                        </ul>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #23324f;">Availability note: ${escapeHtml(displayValue(booking.availability_note))}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Visit address",
                      `
                        <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.8; color: #23324f;">${addressLines.map((line) => escapeHtml(line)).join("<br />")}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #23324f;">Vehicle driveable: ${escapeHtml(formatDriveableValue(booking.vehicle_driveable))}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Additional notes",
                      `
                        <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #23324f;">${escapeHtml(displayValue(booking.work_notes))}</p>
                      `,
                    )}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 28px 28px; font-size: 13px; line-height: 1.7; color: #50627e;">
                    This admin alert was generated automatically after a booking was submitted on
                    <a href="${escapeHtml(publicWebsiteUrl)}" style="color: #1c69d4; text-decoration: none;">${escapeHtml(publicWebsiteUrl)}</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = [
    "STM Motors - New booking received",
    "",
    `Booking reference: ${booking.booking_number}`,
    `Submitted at: ${formatSubmittedAt(booking.created_at)}`,
    `Website source: ${websiteSource ?? publicWebsiteUrl}`,
    "",
    "Customer",
    `Name: ${booking.full_name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    "",
    "Vehicle",
    `Registration: ${booking.car_registration}`,
    `Vehicle details: ${buildVehicleLabel(booking)}`,
    "",
    "Selected services",
    ...serviceNames.map((serviceName) => `- ${serviceName}`),
    `Estimated price: ${pricingDisplayLabel}`,
    "",
    "Availability submitted",
    ...availabilityLines.map((line) => `- ${line}`),
    `Availability note: ${displayValue(booking.availability_note)}`,
    "",
    "Visit address",
    ...addressLines,
    `Vehicle driveable: ${formatDriveableValue(booking.vehicle_driveable)}`,
    "",
    `Additional notes: ${displayValue(booking.work_notes)}`,
  ].join("\n");

  return { subject, html, text };
}

export function buildCustomerBookingEmail(
  context: BookingEmailContext,
): PreparedBookingEmail {
  const { booking, publicWebsiteUrl } = context;
  const availabilityLines = buildAvailabilityLines(booking.availability);
  const serviceNames = getServiceNames(booking.selected_services);
  const addressLines = buildAddressLines(booking);
  const firstName = customerFirstName(booking.full_name);
  const pricingDisplayLabel = formatBookingPricing(booking);
  const subject = `Your STM Motors Booking Is Confirmed - ${booking.booking_number}`;

  const html = `
    <!doctype html>
    <html lang="en">
      <body style="margin: 0; padding: 0; background: #f4f8ff; font-family: Arial, Helvetica, sans-serif; color: #0b1730;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f4f8ff; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #d9e5fb;">
                <tr>
                  <td style="padding: 30px 28px 24px; background: #1c69d4; color: #ffffff;">
                    <div style="font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.76);">
                      STM Motors
                    </div>
                    <h1 style="margin: 12px 0 12px; font-size: 32px; line-height: 1.15; font-weight: 700; color: #ffffff;">
                      Booking confirmed
                    </h1>
                    <p style="margin: 0; font-size: 16px; line-height: 1.75; color: rgba(255,255,255,0.9);">
                      Thank you for booking with STM Motors. Your mobile mechanic appointment request has been received and confirmed.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px;">
                    <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.8; color: #23324f;">
                      Hi ${escapeHtml(firstName)},
                    </p>
                    <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.8; color: #23324f;">
                      Our team has received your booking details. A mechanic will attend the address provided for the selected service once the visit is scheduled from the availability you submitted.
                    </p>
                    ${sectionCard(
                      "Booking reference",
                      `<p style="margin: 0; font-size: 26px; line-height: 1.3; font-weight: 700; color: #0b1730;">${escapeHtml(booking.booking_number)}</p>`,
                      "#f8fbff",
                    )}
                    ${sectionCard(
                      "Service details",
                      `
                        <ul style="margin: 0 0 12px 18px; padding: 0; color: #23324f;">
                          ${serviceNames
                            .map(
                              (serviceName) =>
                                `<li style="margin-bottom: 6px; font-size: 15px; line-height: 1.6;">${escapeHtml(serviceName)}</li>`,
                            )
                            .join("")}
                        </ul>
                        <p style="margin: 0; font-size: 16px; line-height: 1.7; font-weight: 700; color: #0b1730;">Estimated price: ${escapeHtml(pricingDisplayLabel)}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Vehicle",
                      `
                        <p style="margin: 0 0 8px; font-size: 18px; line-height: 1.5; font-weight: 700; color: #0b1730;">${escapeHtml(booking.car_registration)}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #23324f;">${escapeHtml(buildVehicleLabel(booking))}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Availability submitted",
                      `
                        <ul style="margin: 0 0 12px 18px; padding: 0; color: #23324f;">
                          ${availabilityLines
                            .map(
                              (line) =>
                                `<li style="margin-bottom: 6px; font-size: 15px; line-height: 1.6;">${escapeHtml(line)}</li>`,
                            )
                            .join("")}
                        </ul>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #23324f;">Service address:<br />${addressLines.map((line) => escapeHtml(line)).join("<br />")}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Your notes",
                      `
                        <p style="margin: 0 0 10px; font-size: 15px; line-height: 1.8; color: #23324f;">Booking note: ${escapeHtml(displayValue(booking.work_notes))}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #23324f;">Availability note: ${escapeHtml(displayValue(booking.availability_note))}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Important note",
                      `
                        <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #23324f;">
                          Please check that your vehicle registration, service address, and booking notes are correct. If anything needs to change, contact us at
                          <a href="mailto:info@stmmotors.com" style="color: #1c69d4; text-decoration: none;">info@stmmotors.com</a>.
                        </p>
                      `,
                    )}
                    <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.8; color: #50627e;">
                      Website: <a href="${escapeHtml(publicWebsiteUrl)}" style="color: #1c69d4; text-decoration: none;">${escapeHtml(publicWebsiteUrl)}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 28px 28px; font-size: 13px; line-height: 1.8; color: #50627e;">
                    This email was generated because a booking was submitted on stmmotors.com.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = [
    "STM Motors - Booking confirmed",
    "",
    `Hi ${firstName},`,
    "",
    "Thank you for booking with STM Motors. Your mobile mechanic appointment request has been received and confirmed.",
    "A mechanic will attend the address provided for the selected service once the visit is scheduled from the availability you submitted.",
    "",
    `Booking reference: ${booking.booking_number}`,
    `Estimated price: ${pricingDisplayLabel}`,
    "",
    "Selected services",
    ...serviceNames.map((serviceName) => `- ${serviceName}`),
    "",
    `Vehicle registration: ${booking.car_registration}`,
    `Vehicle details: ${buildVehicleLabel(booking)}`,
    "",
    "Availability submitted",
    ...availabilityLines.map((line) => `- ${line}`),
    "",
    "Service address",
    ...addressLines,
    "",
    `Booking note: ${displayValue(booking.work_notes)}`,
    `Availability note: ${displayValue(booking.availability_note)}`,
    "",
    "Please check that your vehicle and address details are correct. If anything needs changing, contact info@stmmotors.com.",
    `Website: ${publicWebsiteUrl}`,
    "",
    "This email was generated because a booking was submitted on stmmotors.com.",
  ].join("\n");

  return { subject, html, text };
}
