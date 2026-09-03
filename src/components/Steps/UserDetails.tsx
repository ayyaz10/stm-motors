import { useMemo, useRef, useState } from "react";
import PricingDisclaimer from "../PricingDisclaimer";
import { getServicePricingSummary, services } from "../../data/services";
import { createBooking, type CreatedBooking } from "../../lib/bookings";
import type { VehiclePricingLoadState } from "../../lib/useVehicleServicePricing";
import { getSelectedVehiclePricingSummary } from "../../lib/vehiclePricing";
import {
  normalizeAvailabilityDays,
  type BookingAvailabilityState,
} from "../../lib/availability";
import validatePostcode, { formatPostcode } from "../../utils/postcode";

interface BookingUserDetails {
  fullName: string;
  phone: string;
  email: string;
  street1: string;
  street2: string;
  city: string;
  postcode: string;
  carRegistration: string;
  workNotes: string;
  vehicleDriveable: "" | "yes" | "no";
}

interface UserDetailsProps {
  selectedWorks: string[];
  formPlateData: {
    registration: string;
    postcode: string;
  };
  formDetailsData: {
    vehicleModelId: number | null;
    make: string;
    model: string;
    fuel: string;
    engine: string;
    year: string;
    postcode: string;
  };
  vehiclePricingState: VehiclePricingLoadState;
  bookingAvailability: BookingAvailabilityState;
  userDetails: BookingUserDetails;
  setUserDetails: React.Dispatch<React.SetStateAction<BookingUserDetails>>;
  setCreatedBooking: React.Dispatch<React.SetStateAction<CreatedBooking | null>>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const todayDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const inputClassName = "public-input border border-[var(--public-border)]";
const sectionCardClassName =
  "rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6";

function UserDetails({
  selectedWorks,
  formPlateData,
  formDetailsData,
  vehiclePricingState,
  bookingAvailability,
  userDetails,
  setUserDetails,
  setCreatedBooking,
  goToNextStep,
  goToPreviousStep,
}: UserDetailsProps) {
  const [errors, setErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
    street1: "",
    city: "",
    postcode: "",
    carRegistration: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submissionIdempotencyKeyRef = useRef<string | null>(null);
  const submissionFingerprintRef = useRef<string | null>(null);

  const selectedServiceObjects = useMemo(
    () => services.filter((service) => selectedWorks.includes(service.id)),
    [selectedWorks],
  );

  const fallbackTotalPrice = useMemo(
    () =>
      selectedServiceObjects.reduce(
        (total, service) => total + service.price,
        0,
      ),
    [selectedServiceObjects],
  );
  const fallbackPricingSummary = useMemo(
    () => getServicePricingSummary(selectedWorks, fallbackTotalPrice),
    [fallbackTotalPrice, selectedWorks],
  );
  const estimatedPricingSummary = useMemo(
    () =>
      getSelectedVehiclePricingSummary(
        selectedWorks,
        vehiclePricingState.pricing,
      ),
    [selectedWorks, vehiclePricingState.pricing],
  );
  const pricingDisplayLabel =
    estimatedPricingSummary?.displayLabel ?? fallbackPricingSummary.displayLabel;
  const pricingHelperText =
    vehiclePricingState.status === "loading"
      ? "Calculating the estimated price for your vehicle..."
      : fallbackPricingSummary.helperText;

  const fallbackRegistration =
    formPlateData.registration ||
    `${formDetailsData.make} ${formDetailsData.model} ${formDetailsData.year}`.trim();

  const displayedRegistration =
    userDetails.carRegistration.trim() || fallbackRegistration || "Registration to be confirmed";
  const displayedPostcode = formatPostcode(
    userDetails.postcode || formPlateData.postcode || formDetailsData.postcode || "",
  );
  const vehicleTitle =
    [formDetailsData.make, formDetailsData.model, formDetailsData.year]
      .filter(Boolean)
      .join(" ") || "Vehicle details to be confirmed";
  const vehicleMeta = [formDetailsData.fuel, formDetailsData.engine]
    .filter(Boolean)
    .join(" / ");

  const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

  const validateName = (value: string) => {
    const cleaned = normalizeSpaces(value);

    if (!cleaned) return "Full name is required.";
    if (cleaned.length < 2) return "Full name is too short.";
    if (cleaned.length > 60) return "Full name is too long.";
    if (!/^[a-zA-Z\s'-]+$/.test(cleaned)) {
      return "Enter a valid full name.";
    }

    return "";
  };

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\s+/g, "").trim();

    if (!cleaned) return "Phone number is required.";
    if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
      return "Enter a valid phone number.";
    }

    return "";
  };

  const validateEmail = (value: string) => {
    const cleaned = value.trim().toLowerCase();

    if (!cleaned) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      return "Enter a valid email address.";
    }

    return "";
  };

  const validateStreet1 = (value: string) => {
    const cleaned = normalizeSpaces(value);

    if (!cleaned) return "Street address is required.";
    if (cleaned.length < 5) return "Enter a fuller street address.";
    if (cleaned.length > 100) return "Street address is too long.";

    return "";
  };

  const validateCity = (value: string) => {
    const cleaned = normalizeSpaces(value);

    if (!cleaned) return "City is required.";
    if (cleaned.length < 2) return "City is too short.";
    if (cleaned.length > 50) return "City is too long.";
    if (!/^[a-zA-Z\s'-]+$/.test(cleaned)) {
      return "Enter a valid city.";
    }

    return "";
  };

  const validatePostcodeField = (value: string) => {
    const cleaned = value.trim().toUpperCase();

    if (!cleaned) return "Postcode is required.";
    if (!validatePostcode(cleaned)) return "Enter a valid postcode.";

    return "";
  };

  const validateCarRegistration = (value: string) => {
    const cleaned = value.replace(/\s+/g, "").trim().toUpperCase();

    if (!cleaned) return "Car registration is required.";
    if (cleaned.length < 2 || cleaned.length > 10) {
      return "Enter a valid registration number.";
    }
    if (!/^[A-Z0-9]+$/.test(cleaned)) {
      return "Enter a valid registration number.";
    }

    return "";
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "fullName":
        return validateName(value);
      case "phone":
        return validatePhone(value);
      case "email":
        return validateEmail(value);
      case "street1":
        return validateStreet1(value);
      case "city":
        return validateCity(value);
      case "postcode":
        return validatePostcodeField(value);
      case "carRegistration":
        return validateCarRegistration(value);
      default:
        return "";
    }
  };

  const getValidationErrors = () => ({
    fullName: validateName(userDetails.fullName),
    phone: validatePhone(userDetails.phone),
    email: validateEmail(userDetails.email),
    street1: validateStreet1(userDetails.street1),
    city: validateCity(userDetails.city),
    postcode: validatePostcodeField(userDetails.postcode),
    carRegistration: validateCarRegistration(userDetails.carRegistration),
  });

  const updateField = (name: keyof BookingUserDetails, value: string) => {
    setUserDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name in errors) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }

    if (submitError) {
      setSubmitError("");
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    updateField(name as keyof BookingUserDetails, value);
  };

  const handleBlur = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    let finalValue = value;

    if (name === "postcode") {
      finalValue = formatPostcode(value);
      updateField("postcode", finalValue);
    }

    if (name in errors) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, finalValue),
      }));
    }
  };

  const buildBookingPayload = () => {
    const cleanedRegistration =
      userDetails.carRegistration.trim() || fallbackRegistration;

    return {
      full_name: normalizeSpaces(userDetails.fullName),
      phone: userDetails.phone.replace(/\s+/g, ""),
      email: userDetails.email.trim().toLowerCase(),
      street_address_1: normalizeSpaces(userDetails.street1),
      street_address_2: userDetails.street2
        ? normalizeSpaces(userDetails.street2)
        : null,
      city: normalizeSpaces(userDetails.city),
      postcode: formatPostcode(userDetails.postcode),
      car_registration: cleanedRegistration.replace(/\s+/g, "").toUpperCase(),
      make: formDetailsData.make.trim() || null,
      model: formDetailsData.model.trim() || null,
      fuel: formDetailsData.fuel.trim() || null,
      engine: formDetailsData.engine.trim() || null,
      year: formDetailsData.year.trim() || null,
      vehicle_model_id: formDetailsData.vehicleModelId,
      selected_services: selectedWorks,
      total_price:
        estimatedPricingSummary?.totalPrice ?? fallbackPricingSummary.fixedTotal,
      availability: normalizeAvailabilityDays(bookingAvailability.dates, {
        minDate: todayDateKey(),
      }),
      availability_note: bookingAvailability.mechanicNote.trim() || null,
      work_notes: userDetails.workNotes
        ? normalizeSpaces(userDetails.workNotes)
        : null,
      vehicle_driveable: userDetails.vehicleDriveable || null,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = getValidationErrors();
    setErrors(nextErrors);

    if (
      normalizeAvailabilityDays(bookingAvailability.dates, {
        minDate: todayDateKey(),
      }).length === 0
    ) {
      setSubmitError(
        "Select at least one date and availability window before submitting.",
      );
      return;
    }

    if (Object.values(nextErrors).some(Boolean)) {
      const firstErrorField = Object.keys(nextErrors).find(
        (key) => nextErrors[key as keyof typeof nextErrors],
      );

      if (firstErrorField) {
        const element = document.querySelector(
          `[name="${firstErrorField}"]`,
        ) as HTMLElement | null;

        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        element?.focus();
      }

      return;
    }

    try {
      setIsSubmitting(true);
      const bookingPayload = buildBookingPayload();
      const submissionFingerprint = JSON.stringify(bookingPayload);

      if (
        !submissionIdempotencyKeyRef.current ||
        submissionFingerprintRef.current !== submissionFingerprint
      ) {
        submissionIdempotencyKeyRef.current =
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `booking-${Date.now()}`;
        submissionFingerprintRef.current = submissionFingerprint;
      }

      const booking = await createBooking(bookingPayload, {
        idempotencyKey: submissionIdempotencyKeyRef.current,
      });

      setCreatedBooking(booking);
      submissionIdempotencyKeyRef.current = null;
      submissionFingerprintRef.current = null;
      goToNextStep();
    } catch (error) {
      console.error("Booking submission failed:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your booking.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionHeading = (stepNumber: number, title: string) => (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1c69d4] text-sm font-semibold text-white">
        {stepNumber}
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
        {title}
      </h2>
    </div>
  );

  const renderField = ({
    autoComplete,
    id,
    label,
    name,
    placeholder,
    type = "text",
    value,
  }: {
    autoComplete?: string;
    id: string;
    label: string;
    name: keyof BookingUserDetails;
    placeholder: string;
    type?: string;
    value: string;
  }) => {
    const error = errors[name as keyof typeof errors];
    const describedBy = error ? `${id}-error` : undefined;

    return (
      <div className="space-y-2">
        <label className="public-label" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className={inputClassName}
          type={type}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {error ? (
          <p id={`${id}-error`} className="public-field-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="overflow-hidden rounded-[1.5rem] border border-[#0f4ea8] bg-[#165ab9] text-white shadow-[0_28px_80px_-55px_rgba(16,64,138,0.42)]">
        <div className="grid gap-4 p-4 sm:p-5 lg:p-6">
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-100/85">
                Pricing
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-[2rem]">
                {vehiclePricingState.status === "loading"
                  ? "Calculating..."
                  : pricingDisplayLabel}
              </h2>
              {estimatedPricingSummary ? (
                <PricingDisclaimer
                  hasFromPricing={estimatedPricingSummary.hasFromPrices}
                  className="mt-2 text-xs leading-5 text-blue-100/82"
                />
              ) : (
                <p className="mt-2 text-xs leading-5 text-blue-100/82">
                  {pricingHelperText}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/16 bg-[#1450a1] px-4 py-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blue-100/85">
                  Vehicle information
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {vehicleTitle}
                </p>
                {vehicleMeta ? (
                  <p className="mt-1 text-xs leading-5 text-blue-100/82">
                    {vehicleMeta}
                  </p>
                ) : null}
                <p className="mt-2 text-xs leading-5 text-blue-100/82">
                  {displayedRegistration}
                </p>
                {displayedPostcode ? (
                  <p className="mt-1 text-xs leading-5 text-blue-100/68">
                    {displayedPostcode}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-white/16 bg-[#1450a1] px-4 py-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blue-100/85">
                  Selected services
                </p>
                <div className="mt-2 space-y-2">
                  {selectedServiceObjects.map((service) => (
                    <div
                      key={service.id}
                      className="border-b border-white/14 pb-2 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm font-semibold text-white">
                        {service.name}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-blue-100/82">
                        Labour time: {service.labourTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionCardClassName}>
        {renderSectionHeading(1, "Your details")}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {renderField({
            id: "full-name",
            label: "Full name",
            name: "fullName",
            placeholder: "Your full name",
            autoComplete: "name",
            value: userDetails.fullName,
          })}
          {renderField({
            id: "email",
            label: "Email address",
            name: "email",
            placeholder: "you@example.com",
            type: "email",
            autoComplete: "email",
            value: userDetails.email,
          })}
        </div>
      </section>

      <section className={sectionCardClassName}>
        {renderSectionHeading(2, "Work details")}
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Share any useful details about the problem, symptoms, or previous
            work so the mechanic has better context before the visit.
          </div>

          <div className="space-y-2">
            <label className="public-label" htmlFor="work-notes">
              Service notes
            </label>
            <textarea
              id="work-notes"
              name="workNotes"
              className={`${inputClassName} min-h-32 resize-y`}
              placeholder="Describe anything the mechanic should know before the appointment."
              value={userDetails.workNotes}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </section>

      <section className={sectionCardClassName}>
        {renderSectionHeading(3, "Booking address & phone")}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="public-label" htmlFor="street1">
              Street address 1
            </label>
            <input
              id="street1"
              className={inputClassName}
              type="text"
              name="street1"
              autoComplete="address-line1"
              placeholder="Street address"
              value={userDetails.street1}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(errors.street1)}
              aria-describedby={errors.street1 ? "street1-error" : undefined}
            />
            {errors.street1 ? (
              <p id="street1-error" className="public-field-error">
                {errors.street1}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="public-label" htmlFor="street2">
              Street address 2
            </label>
            <input
              id="street2"
              className={inputClassName}
              type="text"
              name="street2"
              autoComplete="address-line2"
              placeholder="Apartment, suite, or optional details"
              value={userDetails.street2}
              onChange={handleChange}
            />
          </div>

          {renderField({
            id: "city",
            label: "City",
            name: "city",
            placeholder: "City",
            autoComplete: "address-level2",
            value: userDetails.city,
          })}
          {renderField({
            id: "postcode",
            label: "Postcode",
            name: "postcode",
            placeholder: "SW1A 1AA",
            autoComplete: "postal-code",
            value: userDetails.postcode,
          })}
          {renderField({
            id: "phone",
            label: "Phone number",
            name: "phone",
            placeholder: "07...",
            autoComplete: "tel",
            value: userDetails.phone,
          })}

          <p className="text-sm text-[var(--public-muted)] md:col-span-2">
            We will use this phone number for booking updates if needed.
          </p>
        </div>
      </section>

      <section className={sectionCardClassName}>
        {renderSectionHeading(4, "Car registration")}
        <div className="mt-6 space-y-4">
          <p className="text-sm leading-6 text-[var(--public-muted)]">
            Please provide the registration number for this booking.
          </p>

          {renderField({
            id: "car-registration",
            label: "Registration number",
            name: "carRegistration",
            placeholder: "AB12 CDE",
            autoComplete: "off",
            value: userDetails.carRegistration,
          })}

          {!userDetails.carRegistration && fallbackRegistration ? (
            <p className="text-sm text-[var(--public-muted)]">
              Suggested registration: {fallbackRegistration}
            </p>
          ) : null}
        </div>
      </section>

      <section className={sectionCardClassName}>
        {renderSectionHeading(5, "Your vehicle")}
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">{vehicleTitle}</p>
            {vehicleMeta ? (
              <p className="mt-1 text-sm text-[var(--public-muted)]">{vehicleMeta}</p>
            ) : null}
            <p className="mt-2 text-sm text-[var(--public-muted)]">
              Registration: {displayedRegistration}
            </p>
            {displayedPostcode ? (
              <p className="mt-1 text-sm text-[var(--public-muted)]">
                Postcode: {displayedPostcode}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-950">
              Is your vehicle driveable if collection or transport is needed?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    userDetails.vehicleDriveable === option.value
                      ? "border-[#1c69d4] bg-blue-50 text-[#1c69d4]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#1c69d4]"
                  }`}
                >
                  <input
                    type="radio"
                    name="vehicleDriveable"
                    value={option.value}
                    checked={userDetails.vehicleDriveable === option.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {submitError ? (
        <div
          className="public-error-banner"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={isSubmitting}
          className="public-btn-secondary w-full sm:w-auto"
        >
          Previous
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="public-btn-primary w-full sm:w-auto"
        >
          {isSubmitting ? "Submitting..." : "Submit booking"}
        </button>
      </div>
    </form>
  );
}

export default UserDetails;
