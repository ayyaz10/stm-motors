import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import PublicLink from "../components/public/PublicLink";
import { contactDetails } from "../data/siteContent";
import { services } from "../data/services";
import { navigateTo } from "../lib/navigation";
import { usePageMetadata } from "../lib/seo";
import validatePostcode from "../utils/postcode";

const activeServiceCards = services
  .filter((service) => service.active)
  .slice(0, 3)
  .map((service) => ({
    id: service.id,
    price: new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(service.price),
    summary: service.shortDescription,
    title: service.name,
  }));

const trustHighlights = [
  {
    icon: CalendarDays,
    label: "Since 2005",
  },
  {
    icon: BadgeCheck,
    label: "Qualified mechanics",
  },
  {
    icon: ShieldCheck,
    label: "1-year warranty on parts and repairs",
  },
];

const comparisonLinks = [
  { href: "#concept-clean", label: "Concept 00" },
  { href: "#concept-blue", label: "Concept 01" },
  { href: "#concept-photo", label: "Concept 02" },
  { href: "#concept-mobile", label: "Concept 03" },
];

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

const validatePreviewPostcode = (value: string) => {
  if (!value.trim()) {
    return "Postcode is required.";
  }

  if (!validatePostcode(value)) {
    return "Enter a valid UK postcode such as SW1A 1AA.";
  }

  return "";
};

interface PreviewHeroFormProps {
  buttonLabel?: string;
  helperText?: string;
  inlineDesktop?: boolean;
  variant?: "default" | "heroBlue" | "quotePanel";
}

function PreviewHeroForm({
  buttonLabel = "Check availability",
  helperText = "Enter your registration and postcode to continue to the booking flow.",
  inlineDesktop = true,
  variant = "default",
}: PreviewHeroFormProps) {
  const fieldIdPrefix = useId();
  const [registration, setRegistration] = useState("");
  const [postcode, setPostcode] = useState("");
  const [touched, setTouched] = useState({
    registration: false,
    postcode: false,
  });

  const registrationError = validateRegistration(registration);
  const postcodeError = validatePreviewPostcode(postcode);
  const registrationErrorId = `${fieldIdPrefix}-registration-error`;
  const postcodeErrorId = `${fieldIdPrefix}-postcode-error`;
  const isHeroBlue = variant === "heroBlue";
  const isQuotePanel = variant === "quotePanel";

  const handleBlur = (field: "registration" | "postcode") => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      registration: true,
      postcode: true,
    });

    if (registrationError || postcodeError) {
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set("registration", registration.trim().toUpperCase());
    searchParams.set("postcode", postcode.trim().toUpperCase());

    navigateTo(`/book?${searchParams.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={
        isHeroBlue
          ? "max-w-[44rem]"
          : isQuotePanel
            ? "rounded-[1.9rem] bg-white p-5 shadow-[0_28px_60px_-34px_rgba(15,23,42,0.34)] lg:p-6"
            : "rounded-[1.4rem] bg-white p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.35)]"
      }
    >
      {isQuotePanel ? (
        <div className="mb-5">
          <h3 className="text-[1.75rem] font-bold tracking-tight text-slate-950">
            Get a quote
          </h3>
        </div>
      ) : null}

      <div
        className={
          isHeroBlue
            ? "rounded-[1.75rem] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.10)_100%)] p-3 shadow-[0_20px_42px_-30px_rgba(10,25,52,0.42)]"
            : isQuotePanel
              ? "grid gap-3"
              : `grid gap-3 ${inlineDesktop ? "lg:grid-cols-[1.15fr_1fr_auto] lg:items-start" : ""}`
        }
      >
        {isHeroBlue ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={`${fieldIdPrefix}-registration`} className="sr-only">
                Registration
              </label>
              <div className="relative flex min-h-[3.85rem] items-center rounded-[1.35rem] border border-[#dbe9ff] bg-white px-5 shadow-[0_14px_24px_-22px_rgba(15,23,42,0.34)]">
                <CarFront className="absolute left-5 h-4 w-4 text-[#1c69d4]" />
                <input
                  id={`${fieldIdPrefix}-registration`}
                  type="text"
                  autoCapitalize="characters"
                  placeholder="YOUR CAR REG"
                  value={registration}
                  onChange={(event) => setRegistration(event.target.value)}
                  onBlur={() => handleBlur("registration")}
                  aria-invalid={Boolean(touched.registration && registrationError)}
                  aria-describedby={
                    touched.registration && registrationError ? registrationErrorId : undefined
                  }
                  className="w-full border-0 bg-transparent pl-8 text-sm font-semibold tracking-[0.06em] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.registration && registrationError ? (
                <p id={registrationErrorId} className="text-sm text-rose-100">
                  {registrationError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor={`${fieldIdPrefix}-postcode`} className="sr-only">
                Postcode
              </label>
              <div className="relative flex min-h-[3.85rem] items-center rounded-[1.35rem] border border-[#dbe9ff] bg-white px-5 shadow-[0_14px_24px_-22px_rgba(15,23,42,0.34)]">
                <MapPin className="absolute left-5 h-4 w-4 text-[#1c69d4]" />
                <input
                  id={`${fieldIdPrefix}-postcode`}
                  type="text"
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  placeholder="YOUR POSTCODE"
                  value={postcode}
                  onChange={(event) => setPostcode(event.target.value)}
                  onBlur={() => handleBlur("postcode")}
                  aria-invalid={Boolean(touched.postcode && postcodeError)}
                  aria-describedby={touched.postcode && postcodeError ? postcodeErrorId : undefined}
                  className="w-full border-0 bg-transparent pl-8 text-sm font-semibold tracking-[0.06em] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.postcode && postcodeError ? (
                <p id={postcodeErrorId} className="text-sm text-rose-100">
                  {postcodeError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-start pt-1 sm:col-span-2">
              <button
                type="submit"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-semibold text-white shadow-[0_18px_30px_-22px_rgba(8,15,31,0.46)] hover:bg-slate-900 sm:w-auto sm:min-w-[16rem]"
              >
                {buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : isQuotePanel ? (
          <>
            <div className="space-y-2">
              <label htmlFor={`${fieldIdPrefix}-registration`} className="sr-only">
                Registration
              </label>
              <div className="relative flex min-h-14 items-center rounded-full border border-slate-200 bg-slate-50 px-5">
                <CarFront className="absolute left-5 h-4 w-4 text-[#1c69d4]" />
                <input
                  id={`${fieldIdPrefix}-registration`}
                  type="text"
                  autoCapitalize="characters"
                  placeholder="Your registration"
                  value={registration}
                  onChange={(event) => setRegistration(event.target.value)}
                  onBlur={() => handleBlur("registration")}
                  aria-invalid={Boolean(touched.registration && registrationError)}
                  aria-describedby={
                    touched.registration && registrationError ? registrationErrorId : undefined
                  }
                  className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.registration && registrationError ? (
                <p id={registrationErrorId} className="text-sm text-rose-600">
                  {registrationError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor={`${fieldIdPrefix}-postcode`} className="sr-only">
                Postcode
              </label>
              <div className="relative flex min-h-14 items-center rounded-full border border-slate-200 bg-slate-50 px-5">
                <MapPin className="absolute left-5 h-4 w-4 text-[#1c69d4]" />
                <input
                  id={`${fieldIdPrefix}-postcode`}
                  type="text"
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  placeholder="Your postcode"
                  value={postcode}
                  onChange={(event) => setPostcode(event.target.value)}
                  onBlur={() => handleBlur("postcode")}
                  aria-invalid={Boolean(touched.postcode && postcodeError)}
                  aria-describedby={touched.postcode && postcodeError ? postcodeErrorId : undefined}
                  className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.postcode && postcodeError ? (
                <p id={postcodeErrorId} className="text-sm text-rose-600">
                  {postcodeError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1c69d4] px-6 text-sm font-semibold text-white shadow-[0_20px_36px_-24px_rgba(28,105,212,0.5)] hover:bg-[#1557b3]"
            >
              {buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label
                htmlFor={`${fieldIdPrefix}-registration`}
                className="block text-xs font-semibold tracking-[0.14em] uppercase text-slate-500"
              >
                Registration
              </label>
              <div className="relative flex min-h-14 items-center rounded-xl border border-slate-300 bg-white px-4">
                <CarFront className="absolute left-4 h-4 w-4 text-[#1c69d4]" />
                <input
                  id={`${fieldIdPrefix}-registration`}
                  type="text"
                  autoCapitalize="characters"
                  placeholder="AB12 CDE"
                  value={registration}
                  onChange={(event) => setRegistration(event.target.value)}
                  onBlur={() => handleBlur("registration")}
                  aria-invalid={Boolean(touched.registration && registrationError)}
                  aria-describedby={
                    touched.registration && registrationError ? registrationErrorId : undefined
                  }
                  className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.registration && registrationError ? (
                <p id={registrationErrorId} className="text-sm text-rose-600">
                  {registrationError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`${fieldIdPrefix}-postcode`}
                className="block text-xs font-semibold tracking-[0.14em] uppercase text-slate-500"
              >
                Postcode
              </label>
              <div className="relative flex min-h-14 items-center rounded-xl border border-slate-300 bg-white px-4">
                <MapPin className="absolute left-4 h-4 w-4 text-[#1c69d4]" />
                <input
                  id={`${fieldIdPrefix}-postcode`}
                  type="text"
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  placeholder="SW1A 1AA"
                  value={postcode}
                  onChange={(event) => setPostcode(event.target.value)}
                  onBlur={() => handleBlur("postcode")}
                  aria-invalid={Boolean(touched.postcode && postcodeError)}
                  aria-describedby={touched.postcode && postcodeError ? postcodeErrorId : undefined}
                  className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.postcode && postcodeError ? (
                <p id={postcodeErrorId} className="text-sm text-rose-600">
                  {postcodeError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 lg:min-w-[14rem]">
              <span className="hidden text-xs font-semibold tracking-[0.14em] uppercase text-transparent lg:block">
                Action
              </span>
              <button
                type="submit"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3]"
              >
                {buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {!isHeroBlue && !isQuotePanel ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">{helperText}</p>
      ) : null}

    </form>
  );
}

function PreviewAppointmentBar() {
  const fieldIdPrefix = useId();
  const [registration, setRegistration] = useState("");
  const [postcode, setPostcode] = useState("");
  const [touched, setTouched] = useState({
    registration: false,
    postcode: false,
  });

  const registrationError = validateRegistration(registration);
  const postcodeError = validatePreviewPostcode(postcode);
  const registrationErrorId = `${fieldIdPrefix}-registration-error`;
  const postcodeErrorId = `${fieldIdPrefix}-postcode-error`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      registration: true,
      postcode: true,
    });

    if (registrationError || postcodeError) {
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set("registration", registration.trim().toUpperCase());
    searchParams.set("postcode", postcode.trim().toUpperCase());

    navigateTo(`/book?${searchParams.toString()}`);
  };

  return (
    <div className="relative z-10 mx-4 -mt-12 lg:mx-6 lg:-mt-14">
      <div className="overflow-hidden rounded-[1.4rem] border border-[#dbe7f8] bg-white shadow-[0_28px_55px_-34px_rgba(15,23,42,0.38)]">
        <div className="px-4 py-4 lg:px-5">
          <p className="text-lg font-semibold tracking-tight text-slate-950">
            Start your booking
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1">
              <div className="relative flex min-h-12 items-center rounded-lg border border-slate-200 bg-white px-4">
                <CarFront className="absolute left-4 h-4 w-4 text-slate-400" />
                <input
                  id={`${fieldIdPrefix}-registration`}
                  type="text"
                  autoCapitalize="characters"
                  placeholder="Your registration"
                  value={registration}
                  onChange={(event) => setRegistration(event.target.value)}
                  onBlur={() =>
                    setTouched((current) => ({
                      ...current,
                      registration: true,
                    }))
                  }
                  aria-invalid={Boolean(touched.registration && registrationError)}
                  aria-describedby={
                    touched.registration && registrationError ? registrationErrorId : undefined
                  }
                  className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.registration && registrationError ? (
                <p id={registrationErrorId} className="text-xs text-rose-600">
                  {registrationError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="relative flex min-h-12 items-center rounded-lg border border-slate-200 bg-white px-4">
                <MapPin className="absolute left-4 h-4 w-4 text-slate-400" />
                <input
                  id={`${fieldIdPrefix}-postcode`}
                  type="text"
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  placeholder="Your postcode"
                  value={postcode}
                  onChange={(event) => setPostcode(event.target.value)}
                  onBlur={() =>
                    setTouched((current) => ({
                      ...current,
                      postcode: true,
                    }))
                  }
                  aria-invalid={Boolean(touched.postcode && postcodeError)}
                  aria-describedby={touched.postcode && postcodeError ? postcodeErrorId : undefined}
                  className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched.postcode && postcodeError ? (
                <p id={postcodeErrorId} className="text-xs text-rose-600">
                  {postcodeError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#1c69d4] px-6 text-sm font-semibold text-white shadow-[0_18px_30px_-22px_rgba(28,105,212,0.42)] hover:bg-[#1557b3] lg:min-w-[12rem]"
            >
              Check availability
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TrustStrip({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {trustHighlights.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            dark
              ? "bg-white/12 text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          <item.icon className={`h-4 w-4 ${dark ? "text-emerald-300" : "text-[#1c69d4]"}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function SimpleTrustLine() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-blue-50/78">
      {trustHighlights.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <item.icon className="h-4 w-4 text-emerald-300" />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

function ServicePriceCards({ dark = false }: { dark?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {activeServiceCards.map((service) => (
        <article
          key={service.id}
          className={`rounded-[1.25rem] p-5 ${
            dark
              ? "border border-white/12 bg-[#102033] text-white"
              : "border border-slate-200 bg-white text-slate-950"
          }`}
        >
          <p
            className={`text-xs font-semibold tracking-[0.18em] uppercase ${
              dark ? "text-emerald-200/88" : "text-[#1c69d4]"
            }`}
          >
            Fixed Price
          </p>
          <h3 className="mt-3 text-lg font-semibold leading-7">{service.title}</h3>
          <p className="mt-4 text-2xl font-bold">{service.price}</p>
          <p className={`mt-3 text-sm leading-6 ${dark ? "text-white/72" : "text-slate-600"}`}>
            {service.summary}
          </p>
        </article>
      ))}
    </div>
  );
}

interface PreviewNoteProps {
  headline: string;
  points: string[];
}

function PreviewNote({ headline, points }: PreviewNoteProps) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold tracking-[0.18em] uppercase text-[#1c69d4]">
        What This Fixes
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-950">{headline}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {points.map((point) => (
          <div
            key={point}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600"
          >
            <CheckCircle2 className="mb-3 h-4 w-4 text-[#1c69d4]" />
            {point}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroPreviewPage() {
  usePageMetadata({
    title: "STM Motors | Hero Preview Lab",
    description:
      "Preview three grounded homepage hero directions for STM Motors with real photography, practical layouts, and stronger commercial feel.",
    pathname: "/hero-preview",
  });

  return (
    <div className="bg-[#f6f8fb]">
      <section className="border-b border-slate-200 bg-white pt-28 pb-12 lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="rounded-[1.8rem] border border-slate-200 bg-[#f8fbff] p-8 lg:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1c69d4]">
                  <Sparkles className="h-4 w-4" />
                  Real-World Hero Preview
                </span>
                <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  Grounded hero directions without the typical AI glass look
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  These concepts are more like real commercial service websites:
                  solid color blocks, real workshop imagery, cleaner forms, clearer
                  trust signals, and less "floating UI".
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <PublicLink
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-[#1c69d4] hover:text-[#1c69d4]"
                >
                  Back to homepage
                </PublicLink>
                <PublicLink
                  href="/book"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 text-sm font-semibold text-white hover:bg-[#1557b3]"
                >
                  Open booking flow
                  <ArrowUpRight className="h-4 w-4" />
                </PublicLink>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {comparisonLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-[#1c69d4] hover:text-[#1c69d4]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="concept-clean"
        className="pt-12 pb-4 lg:pt-16"
      >
        <div className="relative overflow-hidden bg-[#1C69D4]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_38%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(90deg,rgba(7,30,70,0.00)_0%,rgba(7,30,70,0.14)_100%)]" />
          <div className="mx-auto grid min-h-[78vh] max-w-[92rem] gap-0 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="flex items-center">
              <div className="max-w-2xl px-6 py-14 lg:px-12 lg:py-16 xl:px-16">
                <p className="text-sm font-semibold tracking-[0.22em] uppercase text-blue-100/80">
                  Concept 00 • STM Theme Split Hero
                </p>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl xl:text-[4.1rem] xl:leading-[0.94]">
                  Car servicing and repairs made easy
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-blue-50/80 sm:text-lg">
                  Book fixed-price brake pad replacement or engine oil and filter
                  service at home or work with qualified mechanics, clear pricing, and
                  a service built around your schedule.
                </p>

                <div className="mt-8 max-w-[42rem]">
                  <PreviewHeroForm
                    buttonLabel="Get my instant price"
                    helperText=""
                    variant="heroBlue"
                  />
                </div>

                <div className="mt-6">
                  <SimpleTrustLine />
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[28rem] items-center justify-center overflow-hidden px-6 py-10 lg:min-h-full lg:px-10">
              <div className="absolute h-[22rem] w-[22rem] rounded-full bg-[#184f99] lg:h-[28rem] lg:w-[28rem]" />
              <div className="absolute h-[28rem] w-[28rem] rounded-full border border-white/8 lg:h-[34rem] lg:w-[34rem]" />
              <div className="relative h-[25rem] w-full max-w-[32rem] lg:h-[33rem]">
                <div className="absolute inset-x-[12%] top-[6%] bottom-[0%] overflow-hidden rounded-[46%_46%_42%_42%/34%_34%_62%_62%] border border-white/10 shadow-[0_28px_50px_-34px_rgba(0,0,0,0.42)]">
                  <img
                    src="/images/trusted-mechanics.png"
                    alt="STM Motors mechanic working on a vehicle"
                    className="h-full w-full object-cover object-[58%_24%]"
                  />
                </div>

                <div className="absolute left-0 top-[26%] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1c69d4] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.38)]">
                  Qualified mechanics
                </div>
                <div className="absolute right-0 top-[16%] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1c69d4] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.38)]">
                  Home or work
                </div>
                <div className="absolute right-[8%] bottom-[16%] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1c69d4] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.38)]">
                  Since 2005
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <PreviewNote
            headline="This is the cleanest version so far and keeps only the essentials."
            points={[
              "Only headline, short supporting line, form, and trust strip stay in the hero.",
              "The image is full-bleed now, so the right side feels quieter and less boxed-in.",
              "This should read closer to a real service website and less like a concept layout.",
            ]}
          />
        </div>
      </section>

      <section
        id="concept-blue"
        className="pt-12 pb-4 lg:pt-16"
      >
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#185cbf_0%,#1c69d4_58%,#2d7ae0_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.1),transparent_30%),linear-gradient(90deg,rgba(9,33,77,0.04)_0%,rgba(9,33,77,0.18)_100%)]" />

          <div className="mx-auto grid min-h-[92svh] max-w-[92rem] gap-10 lg:min-h-screen lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="flex items-center">
              <div className="max-w-2xl px-6 py-14 lg:px-12 lg:py-16 xl:px-16">
                <p className="text-sm font-semibold tracking-[0.22em] uppercase text-blue-100/80">
                  Concept 01 • Clean Split Hero
                </p>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl xl:text-[4rem] xl:leading-[0.95]">
                  Mobile car care that fits around your day
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-blue-50/82 sm:text-lg">
                  Fixed-price brake pads and oil service at home or work, with clear
                  booking from the start.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PublicLink
                    href="/book"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#185cbf] shadow-[0_20px_36px_-26px_rgba(8,15,31,0.4)] hover:bg-blue-50"
                  >
                    Start booking
                    <ArrowRight className="h-4 w-4" />
                  </PublicLink>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-end px-6 py-10 lg:px-10">
              <div className="relative w-full max-w-[28.5rem]">
                <PreviewHeroForm
                  buttonLabel="Check availability"
                  helperText=""
                  inlineDesktop={false}
                  variant="quotePanel"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <PreviewNote
            headline="This is now the cleaner, full-width version of Concept 01."
            points={[
              "The extra reassurance strip and small supporting stuff have been removed.",
              "The hero now behaves like Concept 00 with a full-width, full-screen layout.",
              "Only headline, short supporting text, CTA, and form remain.",
            ]}
          />
        </div>
      </section>

      <section
        id="concept-photo"
        className="mx-auto max-w-7xl px-6 pt-10 pb-4 lg:px-12"
      >
        <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_28px_60px_-34px_rgba(15,23,42,0.28)]">
          <div className="relative min-h-[44rem]">
            <img
              src="/images/repairs_mechanic.jpg"
              alt="Mechanic working on a customer's vehicle"
              className="absolute inset-0 h-full w-full object-cover object-[76%_center]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,31,0.82)_0%,rgba(7,16,31,0.48)_42%,rgba(7,16,31,0.1)_68%,rgba(7,16,31,0.0)_100%)]" />
            <div className="absolute inset-y-0 left-0 hidden w-[58%] bg-[#12243e]/92 [clip-path:polygon(0_0,72%_0,58%_100%,0_100%)] lg:block" />

            <div className="relative z-10">
              <div className="hidden items-center justify-between border-b border-slate-200 bg-white/96 px-5 py-2 text-[11px] text-slate-500 lg:flex">
                <p>Mobile mechanic servicing, brake pads and oil service</p>
                <div className="flex items-center gap-5">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {contactDetails.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    Coverage checked by postcode
                  </span>
                </div>
              </div>

              <div className="hidden items-center justify-between bg-white/96 px-5 py-4 lg:flex">
                <div className="flex items-center gap-10">
                  <img
                    src="/images/STM_Motors_Horizontal_Header_Logo_dark.png"
                    alt="STM Motors"
                    className="h-10 w-auto object-contain"
                  />
                  <nav className="flex items-center gap-8 text-sm font-medium text-slate-700">
                    <PublicLink href="/">Home</PublicLink>
                    <PublicLink href="/about">About</PublicLink>
                    <PublicLink href="/services">Services</PublicLink>
                    <PublicLink href="/contact">Contact</PublicLink>
                  </nav>
                </div>

                <PublicLink
                  href="/book"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#12243e] px-6 text-sm font-semibold text-white hover:bg-[#0d1b2f]"
                >
                  Book Service
                </PublicLink>
              </div>

              <div className="px-6 pb-24 pt-10 lg:px-8 lg:pb-28 lg:pt-14">
                <div className="max-w-[34rem]">
                  <p className="text-sm font-semibold tracking-[0.2em] uppercase text-slate-200/80">
                    Concept 02 • Angled Photo Hero
                  </p>
                  <h2 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl xl:text-[4rem] xl:leading-[0.94]">
                    Your car service,
                    <br />
                    <span className="text-[#8cc3ff]">booked</span> & sorted without
                    <br />
                    the garage run
                  </h2>
                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-200/82 sm:text-base">
                    Brake pad replacement and oil service brought to your home or work,
                    with a cleaner booking journey from the first step.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <PublicLink
                      href="/book"
                      className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3]"
                    >
                      Book Service
                    </PublicLink>
                    <PublicLink
                      href="/book"
                      className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/24 bg-white/8 px-6 text-sm font-semibold text-white hover:bg-white/12"
                    >
                      Check availability
                    </PublicLink>
                  </div>

                  <p className="mt-7 text-sm text-slate-200/74">
                    Trusted by drivers who want straightforward mobile maintenance.
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden">
              <div className="max-w-xl rounded-[1.5rem] bg-white p-6 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.38)] lg:p-7">
                <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1c69d4]">
                  Concept 02 • Photo-Led Professional Hero
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  Reliable mobile mechanic service with a more established feel
                </h2>
                <p className="mt-5 text-base leading-8 text-slate-600">
                  If you want STM Motors to feel less like a startup landing page and
                  more like a serious service business, a photography-led hero with a
                  strong white content panel works very well.
                </p>

                <div className="mt-6">
                  <PreviewHeroForm
                    buttonLabel="Check local availability"
                    helperText="Start with your reg and postcode, then continue through the booking steps."
                    inlineDesktop={false}
                  />
                </div>
              </div>

              <div className="hidden lg:block" />
            </div>
          </div>
        </div>

        <div className="bg-white pb-6">
          <PreviewAppointmentBar />
        </div>

        <div className="hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                A grounded follow-up strip makes the hero feel more like a live business
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This is where the service-site realism improves: solid reassurance cards
                under a real workshop image instead of floating glass elements.
              </p>
            </div>
            <TrustStrip />
          </div>

          <div className="mt-6">
            <ServicePriceCards />
          </div>
        </div>
        <PreviewNote
          headline="This mirrors the contractor-style hero structure much more closely."
          points={[
            "The left side now uses a dark angled panel over the photo, like the reference.",
            "The top contact strip, white navigation bar, and bottom appointment bar match the composition closely.",
            "The content is still adapted for STM Motors instead of copying the original business text.",
          ]}
        />
      </section>

      <section
        id="concept-mobile"
        className="mx-auto max-w-7xl px-6 pt-10 pb-20 lg:px-12"
      >
        <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_28px_60px_-34px_rgba(15,23,42,0.28)]">
          <div className="relative min-h-[46rem]">
            <img
              src="/images/hero_car.jpg"
              alt="Vehicle in a premium workshop"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,63,141,0.9)_0%,rgba(28,105,212,0.8)_42%,rgba(28,105,212,0.66)_68%,rgba(12,49,114,0.84)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_26%)]" />

            <div className="relative z-10 flex min-h-[46rem] flex-col items-center justify-center px-6 py-14 text-center lg:px-10 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-white/88">
                Mobile mechanic booking
              </span>

              <h2 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl xl:text-[4.15rem] xl:leading-[0.94]">
                Mobile car service
                <br />
                <span className="text-[#8cc3ff]">made simple</span>
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-50/86 sm:text-base">
                Book brake pads or oil service at home or work with a cleaner STM Motors
                booking flow and fixed pricing from the start.
              </p>

              <div className="mt-8 w-full max-w-5xl">
                <PreviewAppointmentBar />
              </div>

              <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                <div className="rounded-full border border-white/16 bg-[#103d87]/78 px-4 py-3 text-sm font-medium text-white/90">
                  Home or workplace visits
                </div>
                <div className="rounded-full border border-white/16 bg-[#103d87]/78 px-4 py-3 text-sm font-medium text-white/90">
                  Fixed-price services
                </div>
                <div className="rounded-full border border-white/16 bg-[#103d87]/78 px-4 py-3 text-sm font-medium text-white/90">
                  Coverage checked by postcode
                </div>
              </div>

              <div className="mt-12 w-full max-w-4xl">
                <img
                  src="/images/service-van.png"
                  alt="STM Motors service van"
                  className="mx-auto w-full object-contain drop-shadow-[0_22px_35px_rgba(7,16,31,0.35)]"
                />
              </div>
            </div>
          </div>
        </div>

        <PreviewNote
          headline="This uses the real photo as the hero base and layers STM blue over it for a more realistic premium feel."
          points={[
            "The background image now does the heavy lifting visually instead of a mostly flat gradient.",
            "The blue overlay keeps the section on-brand while still letting the photo read clearly underneath.",
            "The booking bar stays minimal so the concept feels more real-world and less cluttered.",
          ]}
        />
      </section>
    </div>
  );
}

export default HeroPreviewPage;
