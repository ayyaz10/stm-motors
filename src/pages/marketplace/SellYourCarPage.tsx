import {
  Camera,
  CarFront,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import GoogleRecaptchaField from "../../components/forms/GoogleRecaptchaField";
import {
  MAX_SELLER_IMAGES,
  MAX_SELLER_IMAGE_BYTES,
  submitMarketplaceSellRequest,
  validateMarketplaceImage,
} from "../../lib/marketplace";
import { usePageMetadata } from "../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../lib/siteMode";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  postcode: "",
  preferredContact: "either",
  registrationNumber: "",
  make: "",
  model: "",
  year: "",
  mileage: "",
  fuelType: "",
  transmission: "",
  colour: "",
  bodyType: "",
  serviceHistory: "",
  motExpiry: "",
  previousOwners: "",
  condition: "",
  knownFaults: "",
  outstandingFinance: "unsure",
  expectedPrice: "",
  additionalNotes: "",
  privacyConsent: false,
  website: "",
};

function SellYourCarPage() {
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reference, setReference] = useState("");
  const captchaSiteKey =
    typeof __STM_RECAPTCHA_SITE_KEY__ === "string"
      ? __STM_RECAPTCHA_SITE_KEY__.trim()
      : "";
  usePageMetadata({
    title: "Sell Your Car | STM Motors",
    description:
      "Send STM Motors your vehicle details and optional photos for a straightforward purchase review.",
    pathname: "/sell-your-car",
    canonicalOrigin: MARKETPLACE_SITE_ORIGIN,
  });

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const handleImages = (files: FileList | null) => {
    const next = Array.from(files ?? []);
    if (next.length > MAX_SELLER_IMAGES) {
      setImageError(`Upload no more than ${MAX_SELLER_IMAGES} images.`);
      return;
    }
    const error = next
      .map((file) => validateMarketplaceImage(file, MAX_SELLER_IMAGE_BYTES))
      .find(Boolean);
    if (error) {
      setImageError(error);
      return;
    }
    setImages(next);
    setImageError("");
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (captchaSiteKey && !captchaToken) {
      setSubmitError("Complete the spam protection check.");
      return;
    }
    if (imageError) {
      setSubmitError(imageError);
      return;
    }
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) =>
      payload.set(key, String(value)),
    );
    payload.set("idempotencyKey", idempotencyKey);
    payload.set("sourceUrl", window.location.href);
    if (captchaSiteKey) payload.set("captchaToken", captchaToken);
    images.forEach((image) => payload.append("images", image));
    try {
      setSubmitting(true);
      setSubmitError("");
      const nextReference = await submitMarketplaceSellRequest(payload);
      setReference(nextReference);
      setForm(initialForm);
      setImages([]);
      setIdempotencyKey(crypto.randomUUID());
      setCaptchaToken("");
      setCaptchaReset((value) => value + 1);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your vehicle.",
      );
      setCaptchaReset((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };
  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-[#1c69d4] focus:ring-4 focus:ring-blue-100";

  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_.75fr] lg:items-center lg:px-12 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-300">
              Sell your car
            </p>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
              Tell us about your vehicle.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Send the key details and a few optional photos. STM Motors will
              review everything and contact you about a sensible next step.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-6">
            <ShieldCheck className="h-8 w-8 text-blue-300" />
            <p className="mt-4 font-semibold">
              A submission is not a guaranteed valuation, purchase offer or
              agreement.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Nothing is published automatically. Your details and photos stay
              private to authorised STM Motors staff.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-12 lg:px-12 lg:py-16">
        {reference ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-5 text-3xl font-bold text-emerald-950">
              Vehicle submitted
            </h2>
            <p className="mt-3 text-emerald-800">
              Your reference is <strong>{reference}</strong>. STM Motors will
              review the details and contact you.
            </p>
            <button
              type="button"
              onClick={() => setReference("")}
              className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white"
            >
              Submit another vehicle
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <legend className="px-2 text-xl font-bold">
                Your contact details
              </legend>
              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Full name *
                  <input
                    required
                    minLength={2}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Email *
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Phone *
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Postcode *
                  <input
                    required
                    value={form.postcode}
                    onChange={(e) =>
                      update("postcode", e.target.value.toUpperCase())
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Preferred contact
                  <select
                    value={form.preferredContact}
                    onChange={(e) => update("preferredContact", e.target.value)}
                    className={fieldClass}
                  >
                    <option value="either">Either phone or email</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <legend className="px-2 text-xl font-bold">
                Vehicle details
              </legend>
              <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-semibold">
                  Registration *
                  <input
                    required
                    value={form.registrationNumber}
                    onChange={(e) =>
                      update("registrationNumber", e.target.value.toUpperCase())
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Make *
                  <input
                    required
                    value={form.make}
                    onChange={(e) => update("make", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Model *
                  <input
                    required
                    value={form.model}
                    onChange={(e) => update("model", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Year *
                  <input
                    required
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={form.year}
                    onChange={(e) => update("year", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Mileage *
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.mileage}
                    onChange={(e) => update("mileage", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Fuel type
                  <select
                    value={form.fuelType}
                    onChange={(e) => update("fuelType", e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Select</option>
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>Hybrid</option>
                    <option>Electric</option>
                    <option>LPG</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Transmission
                  <select
                    value={form.transmission}
                    onChange={(e) => update("transmission", e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Select</option>
                    <option>Manual</option>
                    <option>Automatic</option>
                    <option>Semi-automatic</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Colour
                  <input
                    value={form.colour}
                    onChange={(e) => update("colour", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Body type
                  <input
                    value={form.bodyType}
                    onChange={(e) => update("bodyType", e.target.value)}
                    className={fieldClass}
                    placeholder="Hatchback, SUV…"
                  />
                </label>
                <label className="text-sm font-semibold">
                  MOT expiry
                  <input
                    type="date"
                    value={form.motExpiry}
                    onChange={(e) => update("motExpiry", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Previous owners
                  <input
                    type="number"
                    min="0"
                    value={form.previousOwners}
                    onChange={(e) => update("previousOwners", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Expected price (optional)
                  <input
                    type="number"
                    min="0"
                    value={form.expectedPrice}
                    onChange={(e) => update("expectedPrice", e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">
                  Service history
                  <textarea
                    rows={3}
                    value={form.serviceHistory}
                    onChange={(e) => update("serviceHistory", e.target.value)}
                    className={fieldClass}
                    placeholder="Full, partial or no service history; include useful dates if known."
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <legend className="px-2 text-xl font-bold">
                Condition and finance
              </legend>
              <div className="mt-3 grid gap-5">
                <label className="text-sm font-semibold">
                  General condition *
                  <textarea
                    required
                    minLength={10}
                    rows={5}
                    value={form.condition}
                    onChange={(e) => update("condition", e.target.value)}
                    className={fieldClass}
                    placeholder="Describe the bodywork, interior, tyres and how the car drives."
                  />
                </label>
                <label className="text-sm font-semibold">
                  Known faults or damage
                  <textarea
                    rows={4}
                    value={form.knownFaults}
                    onChange={(e) => update("knownFaults", e.target.value)}
                    className={fieldClass}
                    placeholder="Please be honest about warning lights, mechanical faults or damage."
                  />
                </label>
                <label className="text-sm font-semibold">
                  Outstanding finance *
                  <select
                    required
                    value={form.outstandingFinance}
                    onChange={(e) =>
                      update("outstandingFinance", e.target.value)
                    }
                    className={fieldClass}
                  >
                    <option value="unsure">Unsure</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Additional notes
                  <textarea
                    rows={4}
                    value={form.additionalNotes}
                    onChange={(e) => update("additionalNotes", e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <legend className="px-2 text-xl font-bold">
                Private vehicle photos
              </legend>
              <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-300 p-7 text-center">
                <Camera className="mx-auto h-9 w-9 text-[#1c69d4]" />
                <p className="mt-3 font-semibold">
                  Upload up to {MAX_SELLER_IMAGES} optional photos
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  JPG, PNG or WebP. Maximum 4MB each. Photos stay private.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImages(e.target.files)}
                  className="mt-5 block w-full text-sm"
                />
              </div>
              {images.length ? (
                <ul className="mt-4 grid gap-2 text-sm text-slate-600">
                  {images.map((image) => (
                    <li key={`${image.name}-${image.size}`}>
                      {image.name} — {(image.size / 1024 / 1024).toFixed(1)}MB
                    </li>
                  ))}
                </ul>
              ) : null}
              {imageError ? (
                <p className="mt-3 text-sm text-rose-700">{imageError}</p>
              ) : null}
            </fieldset>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                <input
                  required
                  type="checkbox"
                  checked={form.privacyConsent}
                  onChange={(e) => update("privacyConsent", e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                I agree that STM Motors may securely store these details and
                private photos to review my vehicle and contact me about this
                request.
              </label>
              {captchaSiteKey ? (
                <div className="mt-5">
                  <GoogleRecaptchaField
                    siteKey={captchaSiteKey}
                    onTokenChange={setCaptchaToken}
                  resetSignal={captchaReset}
                  />
                </div>
              ) : null}
              {submitError ? (
                <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {submitError}
                </p>
              ) : null}
              <button
                disabled={submitting}
                className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 font-semibold text-white disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Submitting securely…
                  </>
                ) : (
                  <>
                    <CarFront className="h-5 w-5" />
                    Submit vehicle for review
                  </>
                )}
              </button>
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                This request is not a guaranteed valuation, purchase offer or
                agreement. STM Motors will confirm any next step directly.
              </p>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default SellYourCarPage;
