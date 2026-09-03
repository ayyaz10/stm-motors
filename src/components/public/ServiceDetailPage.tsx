import { ArrowRight } from "lucide-react";
import type { ServicePageDefinition } from "../../data/servicePages";
import { contactDetails } from "../../data/siteContent";
import { usePageMetadata } from "../../lib/seo";
import PublicLink from "./PublicLink";

interface ServiceDetailPageProps {
  servicePage: ServicePageDefinition;
}

function ServiceDetailPage({ servicePage }: ServiceDetailPageProps) {
  const normalizedPriceLabel = servicePage.priceLabel.toLowerCase();
  const isFixedPriceService =
    normalizedPriceLabel.includes("£") &&
    !normalizedPriceLabel.includes("quoted") &&
    !normalizedPriceLabel.includes("labour");
  const isRequestOnlyService = servicePage.bookableOnline && !isFixedPriceService;

  usePageMetadata({
    title: `${servicePage.title} | STM Motors`,
    description: servicePage.description,
    pathname: servicePage.href,
  });

  return (
    <div className="w-full">
      <section className="border-b border-slate-200 bg-white">
        <div className="public-container pt-28 pb-14 lg:pt-32 lg:pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {servicePage.title}
              </h1>
              <p className="mt-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1557b3]">
                {servicePage.priceLabel}
              </p>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                {servicePage.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {servicePage.bookableOnline ? (
                  <PublicLink
                    href="/book"
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    {isRequestOnlyService ? "Request this service" : "Book this service"}
                    <ArrowRight className="h-4 w-4" />
                  </PublicLink>
                ) : (
                  <a
                    href={`tel:${contactDetails.phone}`}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    Call for a quote
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}

                <PublicLink
                  href="/services"
                  className="public-btn-secondary inline-flex items-center justify-center gap-2"
                >
                  View all services
                </PublicLink>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                {servicePage.bookableOnline
                  ? isRequestOnlyService
                    ? "You can request this service online now. Final pricing is confirmed after STM Motors reviews the job."
                    : "Online booking is available for this fixed-price service."
                  : `For this service, call ${contactDetails.phone} or email ${contactDetails.email} for a tailored quote.`}
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] shadow-[0_28px_80px_-58px_rgba(15,23,42,0.35)]">
              <img
                src={servicePage.image}
                alt={servicePage.title}
                className="h-[22rem] w-full object-cover sm:h-[28rem] lg:h-[34rem]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="public-container py-12 lg:py-16">
          <div className="max-w-3xl">
            <h2 className="font-heading text-2xl font-semibold text-slate-950 sm:text-3xl">
              Services Include
            </h2>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {servicePage.services.map((service) => (
              <li key={service.title} className="list-none">
                <article className="h-full rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-base font-medium text-slate-900">
                    {service.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {service.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white">
        <div className="public-container py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-heading text-2xl font-semibold text-slate-950">
                Common reasons to book
              </h2>
              <div className="mt-6 space-y-3">
                {servicePage.reasonsToBook.map((reason) => (
                  <div key={reason} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1c69d4]" />
                    <p className="text-sm leading-7 text-slate-700 sm:text-base">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-heading text-2xl font-semibold text-slate-950">
                Important to know
              </h2>
              <div className="mt-6 space-y-3">
                {servicePage.importantNotes.map((note) => (
                  <div key={note} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1c69d4]" />
                    <p className="text-sm leading-7 text-slate-700 sm:text-base">
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#1c69d4] py-12 lg:py-16">
        <div className="public-container">
          <div className="rounded-[2rem] bg-white px-6 py-8 text-center shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)] sm:px-10">
            <h2 className="font-heading text-3xl font-semibold text-slate-950">
              Need help choosing the right service?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Tell STM Motors what the car is doing and we will help point you
              toward the right next step.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {servicePage.bookableOnline ? (
                <PublicLink
                  href="/book"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {isRequestOnlyService ? "Request service" : "Book service"}
                  <ArrowRight className="h-4 w-4" />
                </PublicLink>
              ) : (
                <a
                  href={`mailto:${contactDetails.email}`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Email for a quote
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}

              <a
                href={`tel:${contactDetails.phone}`}
                className="public-btn-secondary inline-flex items-center gap-2"
              >
                {contactDetails.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ServiceDetailPage;
