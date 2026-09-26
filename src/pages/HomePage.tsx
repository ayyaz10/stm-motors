import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import HomeFaqSection from "../components/public/HomeFaqSection";
import MechanicRecruitmentModal from "../components/public/MechanicRecruitmentModal";
import HeroBookingForm from "../components/public/HeroBookingForm";
import HeroQuickStartForm from "../components/public/HeroQuickStartForm";
import PublicLink from "../components/public/PublicLink";
import { homeFaqStructuredData } from "../data/homeFaqs";
import { serviceCategorySections } from "../data/servicePages";
import { navigateTo } from "../lib/navigation";
import { usePageMetadata } from "../lib/seo";

const heroTrustCards = [
  {
    icon: BadgeCheck,
    title: "Qualified mechanics",
    description: "Professional mobile technicians for on-site servicing.",
  },
  {
    icon: ShieldCheck,
    title: "1-year warranty",
    description: "Cover on all parts and repairs included in the booking.",
  },
  {
    icon: MapPin,
    title: "Home or workplace",
    description: "Service built around where the vehicle is already parked.",
  },
];

const sectionHeadingClass =
  "text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl";
const sectionBodyClass =
  "mt-4 max-w-3xl text-base leading-8 font-normal text-slate-600 sm:text-lg";
const cardHeadingClass =
  "text-xl font-bold tracking-tight text-slate-950 sm:text-2xl";
const cardBodyClass =
  "mt-3 text-base leading-7 font-normal text-slate-600";
const listBodyClass =
  "pt-1 text-base leading-7 font-normal text-slate-700";

const howItWorksSteps = [
  {
    image: "/reference-home/step1-icon.png",
    title: "Get an instant price quote",
    description:
      "Enter your car registration and postcode, then choose the service you need without working through a confusing enquiry form.",
  },
  {
    image: "/reference-home/step2-icon.png",
    title: "Pick the date, time, and location",
    description:
      "Choose the address that suits you best, whether that is home, work, or another safe place where the vehicle is parked.",
  },
  {
    image: "/reference-home/step3-icon.png",
    title: "Your mechanic comes to you",
    description:
      "STM Motors arrives with the tools, parts, and plan for the job so you can skip the garage drop-off entirely.",
  },
];

const serviceCardStyles: Record<
  string,
  {
    badgeClass: string;
    cardRingClass: string;
  }
> = {
  "brake-services": {
    badgeClass: "bg-blue-100 text-[#1c69d4]",
    cardRingClass: "border-blue-100",
  },
  "routine-servicing": {
    badgeClass: "bg-emerald-100 text-emerald-700",
    cardRingClass: "border-emerald-100",
  },
  "electrical-diagnostics": {
    badgeClass: "bg-amber-100 text-amber-700",
    cardRingClass: "border-amber-100",
  },
  "comfort-chassis": {
    badgeClass: "bg-violet-100 text-violet-700",
    cardRingClass: "border-violet-100",
  },
};

const servicePreviewCount = 3;
const showOriginalHeroBookingForm = false;

const serviceCards = serviceCategorySections.map((category) => ({
  ...category,
  ...serviceCardStyles[category.id],
  featuredServices: category.services.slice(0, servicePreviewCount),
  remainingServicesCount: Math.max(
    category.services.length - servicePreviewCount,
    0,
  ),
}));

const vehicleMakes = [
  ["Ford", "Vauxhall", "Volkswagen", "Toyota", "Honda"],
  ["Nissan", "BMW", "Mercedes-Benz", "Audi", "Skoda"],
  ["Hyundai", "Kia", "Peugeot", "Renault", "Volvo", "And many more..."],
];

const teamCommitments = [
  "Nearly 20 years of hands-on experience in practical vehicle servicing and repair.",
  "Fully qualified and insured professionals for a wide range of mobile car repairs.",
  "Background-checked technicians you can trust at your home or workplace.",
  "Continuous training on modern diagnostics, servicing standards, and vehicle technology.",
  "Friendly, honest service with no unnecessary upselling or pressure.",
];

const whyChooseUs = [
  {
    title: "Home and workplace appointments",
    description:
      "Book the visit around where the car is already parked and avoid the usual garage drop-off and collection routine.",
  },
  {
    title: "Straightforward fixed pricing",
    description:
      "Clearer pricing from the start means less guesswork, fewer surprises, and no pressure around unnecessary extras.",
  },
  {
    title: "Honest service recommendations",
    description:
      "STM Motors focuses on the work the vehicle actually needs, with practical advice instead of padded invoices.",
  },
  {
    title: "Booking that fits your day",
    description:
      "Choose a time that works around your day rather than planning everything around a workshop appointment.",
  },
  {
    title: "Focused mobile car care",
    description:
      "Brake work, servicing, diagnostics, and selected repair categories are presented more clearly so customers can find the right next step faster.",
  },
  {
    title: "Clearer communication",
    description:
      "You get straightforward updates, clearer next steps, and a more confident handover after the visit.",
  },
  {
    title: "Experienced mobile technicians",
    description:
      "Every appointment is handled with careful workmanship, sensible checks, and a professional on-site service standard.",
  },
  {
    title: "Less disruption to your routine",
    description:
      "No waiting rooms, no lift planning, and no wasted time collecting the car later if the job can be done on-site.",
  },
];

interface QuoteFormProps {
  variant: "hero" | "cta";
  registration: string;
  onRegistrationChange: (value: string) => void;
}

const validateQuoteRegistration = (value: string) => {
  const cleaned = value.replace(/\s+/g, "").trim().toUpperCase();

  if (!cleaned) {
    return "Registration number is required.";
  }

  if (cleaned.length < 2 || cleaned.length > 10 || !/^[A-Z0-9]+$/.test(cleaned)) {
    return "Enter a valid registration number.";
  }

  return "";
};

function QuoteForm({
  variant,
  registration,
  onRegistrationChange,
}: QuoteFormProps) {
  const fieldIdPrefix = useId();
  const isHero = variant === "hero";
  const isCta = variant === "cta";
  const [isTouched, setIsTouched] = useState(false);
  const registrationError = validateQuoteRegistration(registration);
  const isFormValid = !registrationError;
  const registrationErrorId = `${fieldIdPrefix}-quote-registration-error`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsTouched(true);

    if (!isFormValid) {
      return;
    }

    const searchParams = new URLSearchParams();
    const cleanedRegistration = registration.trim().toUpperCase();

    if (cleanedRegistration) {
      searchParams.set("registration", cleanedRegistration);
    }

    navigateTo(
      searchParams.toString() ? `/book?${searchParams.toString()}` : "/book",
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={
        isHero
          ? "rounded-[1.75rem] bg-[#1c69d4] p-6 shadow-[0_30px_90px_-40px_rgba(17,24,39,0.8)] sm:p-7"
          : "relative overflow-hidden rounded-[2rem] bg-[#1c69d4] px-6 py-8 text-center shadow-[0_40px_90px_-55px_rgba(15,23,42,0.62)] sm:px-10 sm:py-10 lg:px-12"
      }
    >
      {isCta ? (
        <>
          <span className="pointer-events-none absolute -left-10 bottom-[-3.5rem] h-32 w-32 rounded-full bg-white/8" />
          <span className="pointer-events-none absolute -right-8 top-[-3.5rem] h-32 w-32 rounded-full bg-white/7" />
        </>
      ) : null}

      <div className={isHero ? "text-center" : "relative z-10 text-center"}>
        <h2
          className={
            isHero
              ? "text-2xl font-bold text-white sm:text-[2.05rem]"
              : "text-3xl font-bold tracking-tight text-white sm:text-4xl"
          }
        >
          Get an Instant Quote
        </h2>
        {isCta ? (
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 font-normal text-blue-100 sm:text-lg">
            Enter your vehicle registration and we will show you pricing for
            the services available for your car.
          </p>
        ) : null}
      </div>

      <div
        className={
          isHero
            ? "mt-5 grid gap-3"
            : "relative z-10 mx-auto mt-8 grid max-w-[22.5rem] gap-4 sm:max-w-[24rem]"
        }
      >
        <label
          className={
            isHero
              ? "relative flex min-h-12 items-center rounded-xl border border-white/16 bg-white px-4 text-slate-900"
              : "relative flex min-h-14 items-center rounded-2xl border border-white/12 bg-white px-4 text-slate-900"
          }
        >
          <CarFront className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            name="registration"
            required
            autoCapitalize="characters"
            placeholder="Enter vehicle registration"
            className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            value={registration}
            onChange={(event) => onRegistrationChange(event.target.value)}
            onBlur={() => setIsTouched(true)}
            aria-invalid={Boolean(isTouched && registrationError)}
            aria-describedby={isTouched && registrationError ? registrationErrorId : undefined}
          />
        </label>
        {isTouched && registrationError ? (
          <p id={registrationErrorId} className="text-sm text-rose-100">
            {registrationError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        className={
          isHero
            ? "mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-base font-semibold text-white transition hover:bg-orange-600"
            : "relative z-10 mx-auto mt-4 inline-flex min-h-14 w-full max-w-[22.5rem] items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-base font-semibold text-white transition hover:bg-orange-600 sm:max-w-[24rem]"
        }
      >
        Get an Instant Quote
        <ArrowRight className="h-4 w-4" />
      </button>

      <p
        className={
          isHero
            ? "mt-4 text-center text-xs text-blue-100/84"
            : "relative z-10 mt-4 text-center text-sm text-blue-100/84"
        }
      >
        {isHero
          ? "Free, no-obligation quote in seconds."
          : "Takes less than 30 seconds. No sign-up required."}
      </p>
    </form>
  );
}

function TeamTick() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-[#1c69d4]" />
    </span>
  );
}

function HomePage() {
  usePageMetadata({
    title: "STM Motors | Mobile Mechanic Service at Your Home or Work",
    description:
      "Skip the garage. STM Motors brings mobile brake work, routine servicing, diagnostics, and selected vehicle repairs to your home or workplace.",
    pathname: "/",
    structuredData: homeFaqStructuredData,
  });

  const [registration, setRegistration] = useState("");

  return (
    <div className="w-full bg-white text-slate-900">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#1c69d4] pt-16 sm:pt-16 lg:pt-20">
        <div className="relative flex w-full flex-1 items-center">
          <div className="relative flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden bg-[#1c69d4] px-6 py-12 sm:min-h-[calc(100svh-4rem)] sm:px-8 sm:py-14 lg:min-h-[calc(100svh-5rem)] lg:px-14 lg:py-14">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/reference-home/hero-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-[rgba(28,105,212,0.84)]" />

            <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[0.95]">
                Book car care that
                <span className="block text-[#d8e7ff]">comes to you</span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 font-normal text-white/88 sm:text-lg">
                Skip the garage. STM Motors brings trusted car servicing and
                repairs to your driveway or workplace, with straightforward
                pricing and service built around your schedule.
              </p>

              <div className="mt-8 w-full max-w-[54rem]">
                <div className={showOriginalHeroBookingForm ? "block" : "hidden"}>
                  <HeroBookingForm
                    variant="panel"
                    buttonLabel="Get Your Quote"
                  />
                </div>
                <div className={showOriginalHeroBookingForm ? "hidden" : "block"}>
                  <HeroQuickStartForm />
                </div>
              </div>

              <div className="hidden mt-6 grid w-full max-w-4xl gap-3 md:grid-cols-3">
                {heroTrustCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.05rem] border border-white/10 bg-[#0f3c82]/86 px-5 py-4 text-left shadow-[0_18px_40px_-28px_rgba(8,28,63,0.55)]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-blue-100/78">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 bg-blue-50 py-20 lg:scroll-mt-28 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="max-w-3xl text-left">
            <h2 className={sectionHeadingClass}>How It Works</h2>
            <p className={sectionBodyClass}>
              Get your quote, choose a convenient time and location, and let
              the mechanic come to you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {howItWorksSteps.map((item) => (
              <article
                key={item.title}
                className="relative rounded-[1.6rem] bg-white p-6 text-left shadow-[0_22px_70px_-60px_rgba(15,23,42,0.38)]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-24 w-auto object-contain"
                />
                <h3 className={`mt-5 ${cardHeadingClass}`}>{item.title}</h3>
                <p className={cardBodyClass}>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="services"
        className="scroll-mt-24 bg-slate-50 py-20 lg:scroll-mt-28 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className={sectionHeadingClass}>Our Services</h2>
            <p className={`${sectionBodyClass} mx-auto text-center`}>
              STM Motors covers everyday brake work, routine servicing,
              diagnostics, battery support, heating and air conditioning, plus
              suspension and steering. Selected fixed-price services can be
              booked online, while the wider repair range is presented clearly
              so it is easier to request the right job.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map((service, index) => {
              const isLastTabletCard =
                serviceCards.length % 2 === 1 && index === serviceCards.length - 1;

              return (
              <article
                key={service.id}
                className={`group justify-self-center overflow-hidden rounded-[1.65rem] border bg-white text-left shadow-[0_24px_70px_-58px_rgba(15,23,42,0.28)] transition-transform duration-300 hover:-translate-y-1 ${
                  service.cardRingClass
                } ${isLastTabletCard ? "md:col-span-2 xl:col-span-1" : ""} w-full max-w-[24rem]`}
              >
                <div className="bg-slate-900 px-6 py-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${service.badgeClass}`}
                  >
                    {service.services.length} services
                  </span>
                  <h3 className="mt-4 text-[1.35rem] font-bold tracking-tight text-white sm:text-[1.5rem]">
                    {service.title}
                  </h3>
                </div>

                <div className="flex h-full flex-col p-6">
                  <p className="text-sm leading-7 text-slate-600">
                    {service.description}
                  </p>

                  <div className="mt-6 space-y-3">
                    {service.featuredServices.map((item) => (
                      <PublicLink
                        key={item.href}
                        href={item.href}
                        className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-3 text-left transition hover:border-blue-100 hover:bg-blue-50/70"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#1c69d4]">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                        <span className="text-[0.95rem] leading-6 font-medium text-slate-700">
                          {item.title}
                        </span>
                      </PublicLink>
                    ))}
                  </div>

                  {service.remainingServicesCount > 0 ? (
                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      +{service.remainingServicesCount} more in this category
                    </p>
                  ) : null}

                  <PublicLink
                    href="/services"
                    className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-[#1c69d4] underline-offset-4 hover:text-[#1557b3] hover:underline"
                  >
                    Explore {service.title.toLowerCase()}
                    <ArrowRight className="h-4 w-4" />
                  </PublicLink>
                </div>
              </article>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <PublicLink
              href="/services"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3]"
            >
              View full service list
              <ArrowRight className="h-4 w-4" />
            </PublicLink>
          </div>
        </div>
      </section>

      <section
        id="vehicles-serviced"
        className="scroll-mt-24 bg-[#1c69d4] py-20 lg:scroll-mt-28 lg:py-28"
      >
        <div className="mx-auto max-w-[90rem] lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="relative min-h-[22rem] overflow-hidden rounded-[2rem] lg:min-h-[38rem]">
            <img
              src="/images/vehicle-service.png"
              alt="Mechanic servicing a vehicle underside"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex items-center bg-[#1c69d4] px-6 py-16 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-2xl text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Vehicles Serviced
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 font-normal text-blue-100/88 sm:text-lg">
                We work across a wide range of makes and models, from everyday
                family cars to premium and electric vehicles. If your car is
                not listed, we can confirm suitability before you book.
              </p>

              <div className="mt-12 grid gap-8 text-left sm:grid-cols-2 lg:grid-cols-3">
                {vehicleMakes.map((column) => (
                  <div key={column.join("-")} className="space-y-4">
                    {column.map((make) => (
                      <div key={make} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                        <span className="text-base leading-7 font-normal text-blue-50 sm:text-lg">
                          {make}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="team"
        className="scroll-mt-24 bg-white py-20 lg:scroll-mt-28 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16">
            <div className="relative overflow-hidden rounded-[2rem] shadow-[0_28px_80px_-55px_rgba(15,23,42,0.38)]">
              <img
                src="/images/trusted-mechanics.png"
                alt="STM Motors mechanic working on a vehicle"
                className="h-[30rem] w-full object-cover sm:h-[36rem]"
              />
            </div>

            <div className="text-left">
              <h2 className={sectionHeadingClass}>Our Team</h2>

              <p className="mt-6 max-w-3xl text-base leading-8 font-normal text-slate-600 sm:text-lg">
                At STM Motors, we do not just fix cars, we build trust. Every
                mechanic on the team is carefully selected, properly qualified,
                and trained to work to high professional standards. Since 2005,
                we have focused on delivering honest, reliable car care that
                comes to you.
              </p>

              <div className="mt-8 space-y-3">
                {teamCommitments.map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <TeamTick />
                    <p className={listBodyClass}>{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <PublicLink
                  href="/book"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3]"
                >
                  Book a Service
                  <ArrowRight className="h-4 w-4" />
                </PublicLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="why-choose-us"
        className="scroll-mt-24 bg-[#1c69d4] py-20 lg:scroll-mt-28 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Why Choose Us
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 font-normal text-blue-100/88 sm:text-lg">
              STM Motors is built around practical mobile servicing, clearer
              communication, and appointments that fit around real schedules.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-4">
            {whyChooseUs.map((item) => (
              <article
                key={item.title}
                className="flex h-full flex-col rounded-[1.6rem] border border-white/12 bg-[#165ab9] p-6 text-left shadow-[0_24px_70px_-54px_rgba(8,28,63,0.5)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/10 text-white">
                  <Check className="h-5 w-5" strokeWidth={3} />
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-7 font-normal text-blue-100/86 sm:text-lg">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="px-2 py-2 text-center sm:px-4 lg:px-8">
            <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              We are looking for mechanics in your area
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              If you have relevant experience and want to take on local mobile
              bookings, apply to join the STM Motors mechanic network.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {[
                "Simple application",
                "Approval-based onboarding",
                "Mobile bookings",
                "Local area coverage",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  <Check className="h-4 w-4 text-blue-300" strokeWidth={3} />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <PublicLink
                href="/mechanic/apply"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3]"
              >
                Apply as Mechanic
                <ArrowRight className="h-4 w-4" />
              </PublicLink>
            </div>
          </div>
        </div>
      </section>

      <section
        id="instant-quote"
        className="scroll-mt-24 bg-white py-20 lg:scroll-mt-28 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto max-w-[35rem] sm:max-w-[38rem]">
              <QuoteForm
                variant="cta"
                registration={registration}
                onRegistrationChange={setRegistration}
              />
            </div>
          </div>
        </div>
      </section>

      <HomeFaqSection />
      <MechanicRecruitmentModal />
    </div>
  );
}

export default HomePage;
