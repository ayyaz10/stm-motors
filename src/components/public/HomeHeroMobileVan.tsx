import { BadgeCheck, CalendarDays, ShieldCheck } from "lucide-react";
import HeroBookingForm from "./HeroBookingForm";

const heroTrustPoints = [
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
    label: "1 year warranty",
  },
];



function HomeHeroMobileVan() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0a5f4f_0%,#0a6b57_48%,#0a5f4f_100%)] pt-28 sm:pt-32 lg:pt-20 xl:pt-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_42%)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col px-6 lg:px-12">
        <div className="flex flex-col items-center pt-2 lg:pt-5">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span className="text-sm font-medium text-emerald-50">
              Mobile Mechanic Service
            </span>
          </div>

          <h1 className="max-w-4xl text-center font-heading text-4xl font-semibold leading-[0.98] text-white sm:text-5xl lg:text-[2rem] xl:text-[2.8rem] 2xl:text-[4rem]">
            Book car care that
            <span className="block bg-[linear-gradient(180deg,#8cf1c3_0%,#5ee3b0_100%)] bg-clip-text text-transparent">
              comes to your location
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-center text-md leading-8 text-emerald-50/84 sm:text-xl lg:mt-3 2xl: mt-5 lg:max-w-[42rem] lg:text-[1.05rem] lg:leading-7">
            Book front brake pads, rear brake pads, or an engine oil and
            filter replacement through a mobile mechanic flow built around
            straightforward pricing and your schedule.
          </p>

          <div className="mt-8 w-full max-w-[32rem] lg:mt-3 xl:mt-4 2xl:mt-7">
            <HeroBookingForm />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-emerald-100/86 lg:mt-6">
            {heroTrustPoints.map((item) => {
              const Icon = item.icon;

              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-emerald-200" />
                  {item.label}
                </span>
              );
            })}
          </div>

          <div className="relative z-20 mt-14 -mb-8 flex w-full justify-center pb-0 sm:mt-16 sm:-mb-10 lg:mt-12 lg:-mb-12">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div className="absolute -bottom-2 left-1/2 h-7 w-[78%] -translate-x-1/2 rounded-full bg-black/28 blur-xl" />
              <img
                src="/images/service-van.png"
                alt="STM Motors mobile mechanic service van"
                className="relative z-10 mx-auto w-[88%] object-contain drop-shadow-[0_26px_36px_rgba(0,0,0,0.3)]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroMobileVan;
