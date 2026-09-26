import {
  ArrowLeft,
  CalendarDays,
  Check,
  Fuel,
  Gauge,
  LoaderCircle,
  Mail,
  Phone,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GoogleRecaptchaField from "../../components/forms/GoogleRecaptchaField";
import PublicLink from "../../components/public/PublicLink";
import { contactDetails } from "../../data/siteContent";
import {
  fetchMarketplaceVehicleBySlug,
  formatMarketplaceMileage,
  formatMarketplacePrice,
  getMarketplaceListingImageUrl,
  submitMarketplaceVehicleEnquiry,
  type MarketplaceVehicleListing,
} from "../../lib/marketplace";
import { usePageMetadata } from "../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../lib/siteMode";
import { trackAnalyticsEvent, trackGoogleAdsConversion } from "../../lib/googleTracking";

function MarketplaceVehiclePage({ slug }: { slug: string }) {
  const [vehicle, setVehicle] = useState<MarketplaceVehicleListing | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredContact: "either",
    message: "",
    privacyConsent: false,
    website: "",
  });
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

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchMarketplaceVehicleBySlug(slug)
      .then((result) => {
        if (active) {
          setVehicle(result);
          setLoadError("");
        }
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load this vehicle.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const title = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.derivative ? ` ${vehicle.derivative}` : ""}`
    : "Vehicle details";
  const structuredData = useMemo(
    () =>
      vehicle
        ? {
            "@context": "https://schema.org",
            "@type": "Vehicle",
            name: title,
            url: `${MARKETPLACE_SITE_ORIGIN}/cars/${vehicle.slug}`,
            image: vehicle.images.map((image) =>
              getMarketplaceListingImageUrl(image.storage_path),
            ),
            mileageFromOdometer: {
              "@type": "QuantitativeValue",
              value: vehicle.mileage,
              unitCode: "SMI",
            },
            vehicleModelDate: String(vehicle.year),
            fuelType: vehicle.fuel_type,
            vehicleTransmission: vehicle.transmission,
            offers: {
              "@type": "Offer",
              priceCurrency: "GBP",
              price: vehicle.price,
              availability:
                vehicle.status === "sold"
                  ? "https://schema.org/SoldOut"
                  : vehicle.status === "reserved"
                    ? "https://schema.org/LimitedAvailability"
                    : "https://schema.org/InStock",
            },
          }
        : undefined,
    [title, vehicle],
  );
  usePageMetadata({
    title: vehicle
      ? `${title} for Sale | STM Motors`
      : "Vehicle Details | STM Motors",
    description:
      vehicle?.description ||
      "View a used vehicle from STM Motors and enquire directly.",
    pathname: `/cars/${slug}`,
    canonicalOrigin: MARKETPLACE_SITE_ORIGIN,
    imagePath: vehicle?.images[0]
      ? getMarketplaceListingImageUrl(vehicle.images[0].storage_path)
      : undefined,
    structuredData,
    openGraphType: "product",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!vehicle || vehicle.status === "sold") return;
    if (captchaSiteKey && !captchaToken) {
      setSubmitError("Complete the spam protection check.");
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError("");
      const nextReference = await submitMarketplaceVehicleEnquiry({
        idempotencyKey,
        vehicleId: vehicle.id,
        ...form,
        captchaToken: captchaSiteKey ? captchaToken : undefined,
        sourceUrl: window.location.href,
      });
      setReference(nextReference);
      setForm({
        name: "",
        email: "",
        phone: "",
        preferredContact: "either",
        message: "",
        privacyConsent: false,
        website: "",
      });
      setIdempotencyKey(crypto.randomUUID());
      setCaptchaToken("");
      setCaptchaReset((value) => value + 1);
      trackAnalyticsEvent("marketplace_enquiry_submitted", { source: "marketplace" });
      trackGoogleAdsConversion("marketplace_enquiry");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to send your enquiry.",
      );
      setCaptchaReset((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#1c69d4]" />
        <span className="ml-3">Loading vehicle…</span>
      </div>
    );
  if (loadError || !vehicle)
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Vehicle not found</h1>
        <p className="mt-4 text-slate-600">
          {loadError || "This listing is no longer public."}
        </p>
        <PublicLink
          href="/cars"
          className="mt-7 inline-flex rounded-xl bg-[#1c69d4] px-5 py-3 font-semibold text-white"
        >
          Browse available cars
        </PublicLink>
      </section>
    );

  const heroImage = vehicle.images[activeImage];
  const specs = [
    ["Year", String(vehicle.year)],
    ["Mileage", formatMarketplaceMileage(vehicle.mileage)],
    ["Fuel", vehicle.fuel_type],
    ["Transmission", vehicle.transmission],
    ["Engine", vehicle.engine_size],
    ["Body", vehicle.body_type],
    ["Colour", vehicle.colour],
    ["Doors", vehicle.doors?.toString()],
    ["Seats", vehicle.seats?.toString()],
    ["Previous owners", vehicle.previous_owners?.toString()],
    [
      "MOT expiry",
      vehicle.mot_expiry
        ? new Date(vehicle.mot_expiry).toLocaleDateString("en-GB")
        : null,
    ],
    ["Service history", vehicle.service_history],
  ].filter((item): item is string[] => Boolean(item[1]));

  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-[90rem] px-5 py-8 lg:px-8 lg:py-12">
        <PublicLink
          href="/cars"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1c69d4]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cars
        </PublicLink>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-200">
              <img
                src={getMarketplaceListingImageUrl(
                  heroImage?.storage_path ?? "",
                )}
                alt={heroImage?.alt_text || title}
                className="h-full w-full object-cover"
              />
            </div>
            {vehicle.images.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {vehicle.images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => setActiveImage(index)}
                    className={`aspect-[4/3] overflow-hidden rounded-xl border-2 ${index === activeImage ? "border-[#1c69d4]" : "border-transparent"}`}
                  >
                    <img
                      src={getMarketplaceListingImageUrl(image.storage_path)}
                      alt={image.alt_text || `${title} image ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[.14em] text-[#1c69d4]">
              {vehicle.status === "published" ? "Available" : vehicle.status}
            </span>
            <h1 className="mt-5 text-3xl font-bold">{title}</h1>
            <p className="mt-5 text-3xl font-bold text-[#1c69d4]">
              {formatMarketplacePrice(vehicle.price)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-5 text-sm text-slate-600">
              <span className="flex gap-2">
                <CalendarDays className="h-4 w-4 text-[#1c69d4]" />
                {vehicle.year}
              </span>
              <span className="flex gap-2">
                <Gauge className="h-4 w-4 text-[#1c69d4]" />
                {formatMarketplaceMileage(vehicle.mileage)}
              </span>
              <span className="flex gap-2">
                <Fuel className="h-4 w-4 text-[#1c69d4]" />
                {vehicle.fuel_type}
              </span>
              <span className="flex gap-2">
                <Settings2 className="h-4 w-4 text-[#1c69d4]" />
                {vehicle.transmission}
              </span>
            </div>
            <a
              href={`tel:${contactDetails.phone.replace(/\s+/g, "")}`}
              className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 font-semibold"
            >
              <Phone className="h-4 w-4" />
              Call STM Motors
            </a>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-14 lg:grid-cols-[1fr_.8fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">About this vehicle</h2>
            <p className="mt-5 whitespace-pre-line leading-8 text-slate-600">
              {vehicle.description}
            </p>
            {vehicle.features.length ? (
              <>
                <h3 className="mt-9 text-xl font-bold">Key features</h3>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {vehicle.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <Check className="mt-0.5 h-5 w-5 text-[#1c69d4]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-xl font-bold">Vehicle specification</h2>
            <dl className="mt-5 divide-y divide-slate-200">
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-5 py-3 text-sm"
                >
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="enquire" className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <Mail className="h-8 w-8 text-[#1c69d4]" />
          <h2 className="mt-4 text-3xl font-bold">Enquire about this car</h2>
          {vehicle.status === "sold" ? (
            <p className="mt-4 rounded-xl bg-slate-100 p-4 text-slate-700">
              This vehicle has been sold. Browse current stock for available
              alternatives.
            </p>
          ) : reference ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <p className="font-bold">Enquiry sent successfully.</p>
              <p className="mt-2">
                Reference: {reference}. STM Motors will contact you shortly.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-7 grid gap-5 sm:grid-cols-2"
            >
              <label className="text-sm font-semibold">
                Name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Email *
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Preferred contact
                <select
                  value={form.preferredContact}
                  onChange={(e) =>
                    setForm({ ...form, preferredContact: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                >
                  <option value="either">Either</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </label>
              <label className="sm:col-span-2 text-sm font-semibold">
                Message *
                <textarea
                  required
                  minLength={10}
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  placeholder={`I am interested in the ${title}.`}
                />
              </label>
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="hidden"
                aria-hidden="true"
              />
              <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-600">
                <input
                  required
                  type="checkbox"
                  checked={form.privacyConsent}
                  onChange={(e) =>
                    setForm({ ...form, privacyConsent: e.target.checked })
                  }
                  className="mt-1 h-4 w-4"
                />
                I agree that STM Motors may use these details to respond to this
                vehicle enquiry.
              </label>
              {captchaSiteKey ? (
                <div className="sm:col-span-2">
                  <GoogleRecaptchaField
                    siteKey={captchaSiteKey}
                    onTokenChange={setCaptchaToken}
                    resetSignal={captchaReset}
                  />
                </div>
              ) : null}
              {submitError ? (
                <p className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {submitError}
                </p>
              ) : null}
              <button
                disabled={submitting}
                className="sm:col-span-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1c69d4] px-5 font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send vehicle enquiry"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default MarketplaceVehiclePage;
