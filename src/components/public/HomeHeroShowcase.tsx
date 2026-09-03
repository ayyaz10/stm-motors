import { CheckCircle2 } from "lucide-react";
import { servicePages } from "../../data/servicePages";
import HeroBookingForm from "./HeroBookingForm";

const heroHighlights = [
  "Affordable clear pricing",
  "Mobile booking across the UK",
  "Three focused mobile services",
];

function HomeHeroShowcase() {
  return (
    <section className="relative w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.22),transparent_34%),linear-gradient(120deg,#0f766e_0%,#0d9488_38%,#0f172a_100%)] pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-teal-300/18 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-80 w-80 rounded-full bg-emerald-200/10 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <div className="relative w-full px-6 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-white/72">
              Clear Car Care
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl xl:text-[3.7rem] xl:leading-[1.05]">
              Straightforward car care with a more polished booking experience
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/82">
              Book front brake pads, rear brake pads, or an engine oil and
              filter replacement through a service flow built around careful
              workmanship, mobile convenience, and sensible pricing.
            </p>

            <div className="mt-8 max-w-2xl">
              <HeroBookingForm />
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
              {heroHighlights.map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-100" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="relative mx-auto max-w-[35rem]">
              <div className="absolute inset-0 translate-x-6 translate-y-8 rounded-[2rem] border border-white/10 bg-white/6" />
              <div className="absolute -left-10 top-16 h-28 w-28 rounded-[1.75rem] border border-white/10 bg-white/8 backdrop-blur-sm" />
              <div className="absolute -right-8 bottom-14 h-32 w-32 rounded-[1.75rem] border border-white/10 bg-slate-950/14 backdrop-blur-sm" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)]">
                <div className="absolute inset-x-10 top-0 h-36 rounded-full bg-teal-200/12 blur-3xl" />

                <div className="relative grid gap-4">
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/14 bg-slate-950/20">
                    <img
                      src="/images/hero_car.jpg"
                      alt=""
                      className="h-[22rem] w-full object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {servicePages.map((service) => (
                      <div
                        key={service.href}
                        className="rounded-xl border border-white/18 bg-white px-4 py-4 shadow-sm"
                      >
                        <span className="block h-1 w-10 rounded-full bg-teal-500/70" />
                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
                          {service.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroShowcase;
