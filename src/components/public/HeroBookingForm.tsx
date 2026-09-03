import { ArrowRight, CarFront, MapPin } from "lucide-react";
import { useId, useState } from "react";
import { navigateTo } from "../../lib/navigation";
import validatePostcode from "../../utils/postcode";

const validateRegistration = (value: string) => {
  const cleaned = value.replace(/\s+/g, "").trim().toUpperCase();

  if (!cleaned) {
    return "Registration number is required.";
  }

  if (cleaned.length < 2 || cleaned.length > 10 || !/^[A-Z0-9]+$/.test(cleaned)) {
    return "Enter a valid registration number.";
  }

  return "";
};

const validateHeroPostcode = (value: string) => {
  if (!value.trim()) {
    return "Postcode is required.";
  }

  if (!validatePostcode(value)) {
    return "Enter a valid UK postcode such as SW1A 1AA.";
  }

  return "";
};

interface HeroBookingFormProps {
  buttonLabel?: string;
  variant?: "glass" | "panel";
}

function HeroBookingForm({
  buttonLabel = "Start Booking",
  variant = "glass",
}: HeroBookingFormProps) {
  const fieldIdPrefix = useId();
  const [registration, setRegistration] = useState("");
  const [postcode, setPostcode] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    registration: false,
    postcode: false,
  });
  const registrationErrorId = `${fieldIdPrefix}-registration-error`;
  const postcodeErrorId = `${fieldIdPrefix}-postcode-error`;
  const isPanel = variant === "panel";

  const registrationError = validateRegistration(registration);
  const postcodeError = validateHeroPostcode(postcode);
  const isFormValid = !registrationError && !postcodeError;
  const hasRegistrationValue = registration.trim().length > 0;
  const hasPostcodeValue = postcode.trim().length > 0;
  const showRegistrationError =
    Boolean(registrationError) &&
    ((touched.registration && hasRegistrationValue) || hasSubmitted);
  const showPostcodeError =
    Boolean(postcodeError) &&
    ((touched.postcode && hasPostcodeValue) || hasSubmitted);

  const handleBlur = (field: "registration" | "postcode") => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);

    setTouched({
      registration: true,
      postcode: true,
    });

    if (!isFormValid) {
      return;
    }

    const searchParams = new URLSearchParams();
    const cleanedRegistration = registration.trim().toUpperCase();
    const cleanedPostcode = postcode.trim().toUpperCase();

    if (cleanedRegistration) {
      searchParams.set("registration", cleanedRegistration);
    }

    if (cleanedPostcode) {
      searchParams.set("postcode", cleanedPostcode);
    }

    navigateTo(
      searchParams.toString() ? `/book?${searchParams.toString()}` : "/book",
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        className={
          isPanel
            ? "rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.35)] sm:p-3.5"
            : "rounded-[1.55rem] border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-[0_30px_80px_-48px_rgba(0,0,0,0.55)]"
        }
      >
        <div
          className={
            isPanel
              ? "grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start"
              : "grid gap-3 sm:grid-cols-2"
          }
        >
          <div className="space-y-2">
            <label
              className={
                isPanel
                  ? "relative flex min-h-14 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900"
                  : "relative flex min-h-12 items-center rounded-xl border border-white/18 bg-white/8 px-4 text-white/90"
              }
            >
              <CarFront
                className={
                  isPanel
                    ? "absolute left-3 h-4 w-4 text-[#1c69d4]/70"
                    : "absolute left-3 h-4 w-4 text-emerald-200/80"
                }
              />
              <input
                type="text"
                name="registration"
                required
                autoCapitalize="characters"
                placeholder="Registration number"
                className={
                  isPanel
                    ? "w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    : "w-full border-0 bg-transparent pl-7 text-sm font-medium text-white placeholder:text-emerald-100/52 focus:outline-none focus:ring-0"
                }
                value={registration}
                onChange={(event) => setRegistration(event.target.value)}
                onBlur={() => handleBlur("registration")}
                aria-invalid={showRegistrationError}
                aria-describedby={
                  showRegistrationError ? registrationErrorId : undefined
                }
              />
            </label>
            {!isPanel && showRegistrationError ? (
              <p
                id={registrationErrorId}
                className="public-field-error-inverse"
              >
                {registrationError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className={
                isPanel
                  ? "relative flex min-h-14 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900"
                  : "relative flex min-h-12 items-center rounded-xl border border-white/18 bg-white/8 px-4 text-white/90"
              }
            >
              <MapPin
                className={
                  isPanel
                    ? "absolute left-3 h-4 w-4 text-[#1c69d4]/70"
                    : "absolute left-3 h-4 w-4 text-emerald-200/80"
                }
              />
              <input
                type="text"
                name="postcode"
                required
                autoComplete="postal-code"
                autoCapitalize="characters"
                placeholder="Enter postcode"
                className={
                  isPanel
                    ? "w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    : "w-full border-0 bg-transparent pl-7 text-sm font-medium text-white placeholder:text-emerald-100/52 focus:outline-none focus:ring-0"
                }
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
                onBlur={() => handleBlur("postcode")}
                aria-invalid={showPostcodeError}
                aria-describedby={showPostcodeError ? postcodeErrorId : undefined}
              />
            </label>
            {!isPanel && showPostcodeError ? (
              <p id={postcodeErrorId} className="public-field-error-inverse">
                {postcodeError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={
              isPanel
                ? "inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-30px_rgba(28,105,212,0.55)] transition hover:bg-[#1557b3] disabled:cursor-pointer disabled:opacity-100 md:min-w-[12rem]"
                : "mt-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-emerald-900 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] transition hover:bg-emerald-50 disabled:cursor-pointer disabled:opacity-100"
            }
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {isPanel && (showRegistrationError || showPostcodeError) ? (
          <div className="mt-2 grid gap-2 text-left md:grid-cols-2">
            <div>
              {showRegistrationError ? (
                <p id={registrationErrorId} className="public-field-error">
                  {registrationError}
                </p>
              ) : null}
            </div>
            <div>
              {showPostcodeError ? (
                <p id={postcodeErrorId} className="public-field-error">
                  {postcodeError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}

export default HeroBookingForm;
