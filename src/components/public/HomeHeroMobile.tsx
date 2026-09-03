import {
  CalendarClock,
  CheckCircle2,
  MapPinned,
  Truck,
} from "lucide-react";
import HeroBookingForm from "./HeroBookingForm";

const heroHighlights = [
  "We come to you",
  "Affordable clear pricing",
  "Three focused mobile services",
];

function HomeHeroMobile() {
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
              Mobile Mechanic Service
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl xl:text-[3.7rem] xl:leading-[1.05]">
              Book car care that comes to your location
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/82">
              Book front brake pads, rear brake pads, or an engine oil and
              filter replacement through a mobile mechanic flow built around
              careful work and sensible pricing.
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
              <div className="absolute inset-0 translate-x-5 translate-y-8 rounded-[2rem] border border-white/10 bg-white/6" />
              <div className="absolute -left-8 top-14 h-24 w-24 rounded-[1.75rem] border border-white/10 bg-white/8 backdrop-blur-sm" />
              <div className="absolute -right-8 bottom-10 h-28 w-28 rounded-[1.75rem] border border-white/10 bg-slate-950/16 backdrop-blur-sm" />

              <div className="relative rounded-[2rem] border border-white/14 bg-white/10 p-5 backdrop-blur-sm shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)]">
                <div className="absolute inset-x-8 top-0 h-36 rounded-full bg-teal-200/12 blur-3xl" />

                <div className="relative space-y-4">
                  <div className="relative overflow-hidden rounded-[1.5rem] border border-white/14 bg-slate-950/20">
                    <img
                      src="/images/repairs_mechanic.jpg"
                      alt=""
                      className="h-[25rem] w-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/18 to-transparent p-5">
                      <div className="max-w-xs rounded-xl border border-white/16 bg-slate-950/46 p-4 backdrop-blur-sm">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
                          <MapPinned className="h-4 w-4" />
                          Mobile mechanic
                        </div>
                        <p className="mt-3 text-base font-semibold text-white">
                          Car care at your location
                        </p>
                        <p className="mt-1 text-sm leading-6 text-white/78">
                          Start with your reg, postcode, and service to move
                          straight into the booking flow.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
                    <div className="rounded-xl border border-white/18 bg-white/94 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <CalendarClock className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Mobile Booking
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            A simpler start for on-site appointments
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Choose the work you need and continue through one
                            focused booking journey designed around coming to
                            you.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/18 bg-white/94 p-4 shadow-sm">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Mobile Service
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        Service-van feel for on-site visits
                      </p>
                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5">
                        <div className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                          <span className="h-px flex-1 border-t border-dashed border-teal-300" />
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
                            <Truck className="h-5 w-5" />
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          A clearer mobile-mechanic cue built around reaching
                          your postcode and carrying out the service you book.
                        </p>
                      </div>
                    </div>
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

export default HomeHeroMobile;
