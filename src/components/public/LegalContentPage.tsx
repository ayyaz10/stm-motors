import { ArrowRight, CalendarDays } from "lucide-react";
import type { LegalPageDefinition } from "../../data/legalPages";
import { usePageMetadata } from "../../lib/seo";
import PublicLink from "./PublicLink";

interface LegalContentPageProps {
  page: LegalPageDefinition;
}

function LegalContentPage({ page }: LegalContentPageProps) {
  usePageMetadata({
    title: `${page.title} | STM Motors`,
    description: page.metaDescription,
    pathname: page.pathname,
  });

  return (
    <div className="w-full pt-20">
      <section className="w-full bg-gradient-hero py-14 lg:py-18">
        <div className="w-full px-6 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1c69d4]">
              {page.category}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 lg:text-5xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 lg:text-lg">
              {page.description}
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <CalendarDays className="h-4 w-4 text-[#1c69d4]" />
              Last updated {page.lastUpdated}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-12 lg:py-16">
        <div className="w-full px-6 lg:px-12">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {page.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.5rem] border border-blue-100 bg-white p-6 shadow-[0_24px_55px_-46px_rgba(15,23,42,0.28)] lg:p-8"
              >
                <h2 className="text-2xl font-semibold text-slate-950">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-sm leading-7 text-slate-600 lg:text-[15px]"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-sm leading-7 text-slate-600 lg:text-[15px]"
                      >
                        <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#1c69d4]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.numbered?.length ? (
                  <ol className="mt-4 space-y-3">
                    {section.numbered.map((item, index) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm leading-7 text-slate-600 lg:text-[15px]"
                      >
                        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#1c69d4]">
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {section.note ? (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-sm leading-7 text-[#1557b3]">
                    {section.note}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-slate-50 py-12 lg:py-16">
        <div className="w-full px-6 lg:px-12">
          <div className="mx-auto flex max-w-4xl flex-col gap-5 rounded-[1.75rem] border border-blue-100 bg-white p-8 shadow-[0_24px_55px_-46px_rgba(15,23,42,0.28)] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Need something more specific?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 lg:text-[15px]">
                If your question is about a live booking, a data request, a
                complaint, or a service detail, contact STM Motors directly and
                we will point you to the right next step.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <PublicLink
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 text-sm font-semibold text-white hover:bg-[#1557b3]"
              >
                Contact Us
                <ArrowRight className="h-4 w-4" />
              </PublicLink>
              <PublicLink
                href="/legal"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:border-[#1c69d4] hover:text-[#1c69d4]"
              >
                View all legal pages
              </PublicLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LegalContentPage;
