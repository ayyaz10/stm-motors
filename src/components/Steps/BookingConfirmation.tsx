import { CheckCircle2 } from "lucide-react";
import PricingDisclaimer from "../PricingDisclaimer";
import { getServicePricingSummary, services } from "../../data/services";
import { navigateTo } from "../../lib/navigation";
import type { CreatedBooking } from "../../lib/bookings";
import {
  formatAvailabilityDate,
  formatAvailabilityDaySummary,
} from "../../lib/availability";

interface BookingConfirmationProps {
  createdBooking: CreatedBooking | null;
}

const resetBookingProgress = () => {
  localStorage.removeItem("carSelectionData");
};

function BookingConfirmation({ createdBooking }: BookingConfirmationProps) {
  const handleBookAnother = () => {
    resetBookingProgress();
    navigateTo("/book", true);
    window.location.reload();
  };

  const handleGoHome = () => {
    resetBookingProgress();
    navigateTo("/", true);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const displayedBookingNumber =
    createdBooking?.booking_number?.trim() || createdBooking?.id || "";

  const selectedServiceNames = createdBooking?.selected_services.map(
    (selectedServiceId) =>
      services.find((service) => service.id === selectedServiceId)?.name ||
      selectedServiceId,
  );
  const submittedAvailability = createdBooking?.availability ?? [];
  const pricingSummary = createdBooking
    ? getServicePricingSummary(
        createdBooking.selected_services,
        Number(createdBooking.total_price),
      )
    : null;
  const snapshotPrice = createdBooking
    ? Number(createdBooking.quoted_price ?? createdBooking.total_price)
    : 0;
  const snapshotPriceLabel = Number.isInteger(snapshotPrice)
    ? `£${snapshotPrice.toFixed(0)}`
    : `£${snapshotPrice.toFixed(2)}`;
  const pricingDisplayLabel = createdBooking?.pricing_type === "from"
    ? `From ${snapshotPriceLabel}`
    : createdBooking?.quoted_price !== null &&
        createdBooking?.quoted_price !== undefined
      ? snapshotPriceLabel
      : pricingSummary?.displayLabel ?? "\u2014";
  const hasFromPricing = createdBooking?.pricing_type === "from";

  if (!createdBooking) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm sm:p-6 lg:p-8">
        <div className="mx-auto inline-flex rounded-full bg-blue-50 p-4 text-[#1c69d4]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-semibold text-[var(--public-heading)] sm:text-4xl">
          Booking submitted
        </h1>
        <p className="mt-4 text-base leading-8 text-[var(--public-muted)]">
          Your booking has been received successfully. A confirmation email
          with your booking details has been sent, and we will contact you
          shortly to confirm the next steps.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
          <button
            onClick={handleBookAnother}
            className="public-btn-primary w-full sm:w-auto"
            type="button"
          >
            Book another service
          </button>
          <button
            onClick={handleGoHome}
            className="public-btn-secondary w-full sm:w-auto"
            type="button"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-[#1c69d4] p-5 text-center shadow-sm sm:p-6 lg:p-8">
        <div className="mx-auto inline-flex rounded-full bg-white/20 p-4 text-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-semibold text-white sm:text-4xl">
          Booking confirmed
        </h1>
        <p className="mt-4 text-base leading-8 text-blue-50">
          Your booking has been submitted successfully. A confirmation email
          with your booking details has been sent, and STM Motors will be in
          touch soon to confirm and schedule the service.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-[var(--public-muted)]">Booking number</p>
            <p className="mt-2 font-heading text-2xl font-semibold text-[var(--public-heading)]">
              {displayedBookingNumber}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-[var(--public-muted)]">Booked on</p>
            <p className="mt-2 font-heading text-2xl font-semibold text-[var(--public-heading)]">
              {formatDate(createdBooking.created_at)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-5">
            <p className="text-sm text-[var(--public-muted)]">Customer</p>
            <p className="mt-2 font-semibold text-[var(--public-heading)]">
              {createdBooking.full_name}
            </p>
            <p className="mt-1 text-sm text-[var(--public-muted)]">
              {createdBooking.email}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-5">
            <p className="text-sm text-[var(--public-muted)]">Vehicle</p>
            <p className="mt-2 font-semibold text-[var(--public-heading)]">
              {createdBooking.car_registration}
            </p>
            <p className="mt-1 text-sm text-[var(--public-muted)]">
              Estimated price: {pricingDisplayLabel}
            </p>
            <PricingDisclaimer
              hasFromPricing={hasFromPricing}
              className="mt-2 text-xs leading-5 text-[var(--public-muted)]"
            />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-[var(--public-muted)]">Services booked</p>
          <ul className="mt-3 grid gap-3 text-base text-[var(--public-text)]">
            {selectedServiceNames?.map((serviceName) => (
              <li key={serviceName} className="inline-flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--public-accent)]" />
                <span>{serviceName}</span>
              </li>
            ))}
          </ul>
        </div>

        {submittedAvailability.length > 0 ? (
          <div className="mt-6 rounded-lg border border-slate-200 p-5">
            <p className="text-sm text-[var(--public-muted)]">
              Availability submitted
            </p>
            <ul className="mt-3 grid gap-3 text-sm text-[var(--public-text)]">
              {submittedAvailability.map((day) => (
                <li key={day.date}>
                  <span className="font-semibold text-[var(--public-heading)]">
                    {formatAvailabilityDate(day.date)}
                  </span>
                  <span className="text-[var(--public-muted)]">
                    {" "}
                    - {formatAvailabilityDaySummary(day)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-[#23446f]">
          A confirmation email with your booking details has been sent to your
          email address. STM Motors will also contact you shortly to confirm
          the visit, next steps
          {hasFromPricing
            ? ", and any from-price details that still need review."
            : "."}
        </div>

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
          <button
            onClick={handleBookAnother}
            className="public-btn-primary w-full sm:w-auto"
            type="button"
          >
            Book another service
          </button>
          <button
            onClick={handleGoHome}
            className="public-btn-secondary w-full sm:w-auto"
            type="button"
          >
            Go to homepage
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;
