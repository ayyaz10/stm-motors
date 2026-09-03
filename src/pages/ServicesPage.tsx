import { ArrowRight } from "lucide-react";
import PublicLink from "../components/public/PublicLink";
import { listedServicePages, serviceCategorySections } from "../data/servicePages";
import { usePageMetadata } from "../lib/seo";

function ServicesPage() {
  usePageMetadata({
    title: "Services | STM Motors",
    description:
      "Browse STM Motors mobile brake, servicing, diagnostics, battery, heating, and suspension services.",
    pathname: "/services",
  });

  return (
    <div className="w-full pt-20">
      <section className="w-full border-b border-slate-200 bg-white py-16 lg:py-20">
        <div className="w-full px-6 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-heading text-4xl font-semibold text-slate-950 lg:text-5xl">
              Mobile vehicle care built around the work drivers actually need
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600 lg:text-lg">
              STM Motors covers brake work, routine servicing, diagnostics,
              battery support, heating and air conditioning, plus suspension
              and steering. Selected services can be booked online now, while
              others are quoted after inspection.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1557b3]">
                {listedServicePages.length} service options
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                Home or workplace visits where suitable
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-slate-50 py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="mx-auto max-w-7xl space-y-14">
            {serviceCategorySections.map((category) => (
              <section key={category.id} id={category.id} className="scroll-mt-28">
                <div className="max-w-3xl">
                  <h2 className="font-heading text-2xl font-semibold text-slate-950 lg:text-3xl">
                    {category.title}
                  </h2>
                  <p className="mt-3 text-base leading-8 text-slate-600">
                    {category.description}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {category.services.map((service) => (
                    <article
                      key={service.href}
                      className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="h-52 overflow-hidden">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex h-full flex-col p-6">
                        <h3 className="text-xl font-semibold text-slate-950">
                          {service.title}
                        </h3>
                        <p className="mt-3 inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-[#1557b3]">
                          {service.priceLabel}
                        </p>
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          {service.shortDescription}
                        </p>

                        <div className="mt-5 space-y-2">
                          {service.services.slice(0, 2).map((item) => (
                            <div key={item.title} className="flex items-start gap-3">
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1c69d4]" />
                              <p className="text-sm leading-6 text-slate-700">
                                {item.title}
                              </p>
                            </div>
                          ))}
                        </div>

                        <PublicLink
                          href={service.href}
                          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#1c69d4]"
                        >
                          View service
                          <ArrowRight className="h-4 w-4" />
                        </PublicLink>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <div className="pt-4 text-center">
              <PublicLink
                href="/book"
                className="btn-primary inline-flex items-center gap-2"
              >
                Book available services
                <ArrowRight className="h-4 w-4" />
              </PublicLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
