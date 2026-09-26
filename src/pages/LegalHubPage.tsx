import { ArrowRight, CalendarDays, Scale } from "lucide-react";
import {
  legalHubCategories,
  legalPages,
} from "../data/legalPages";
import { usePageMetadata } from "../lib/seo";
import PublicLink from "../components/public/PublicLink";

const lastUpdated = "4 September 2026";

function LegalHubPage() {
  usePageMetadata({
    title: "Legal Information | STM Motors",
    description:
      "Read STM Motors legal information, including privacy, cookies, booking terms, complaints, cancellations, warranty, and website policies.",
    pathname: "/legal",
  });

  return (
    <div className="w-full pt-20">
      <section className="w-full bg-gradient-hero py-14 lg:py-18">
        <div className="w-full px-6 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1c69d4]">
              Legal Information
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 lg:text-5xl">
              Policies, terms, and customer information
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 lg:text-lg">
              This section brings together the main STM Motors legal, privacy,
              booking, warranty, complaints, and website policies in one place.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <CalendarDays className="h-4 w-4 text-[#1c69d4]" />
              Updated {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-12 lg:py-16">
        <div className="w-full px-6 lg:px-12">
          <div className="mx-auto max-w-6xl space-y-12">
            {legalHubCategories.map((category) => {
              const pages = legalPages.filter((page) => page.category === category);

              return (
                <div key={category}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1c69d4]">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-950">
                        {category}
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {pages.map((page) => (
                      <article
                        key={page.id}
                        className="flex h-full flex-col rounded-[1.5rem] border border-blue-100 bg-white p-6 shadow-[0_24px_55px_-46px_rgba(15,23,42,0.28)]"
                      >
                        <h3 className="text-xl font-semibold text-slate-950">
                          {page.title}
                        </h3>
                        <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                          {page.summary}
                        </p>
                        <PublicLink
                          href={page.pathname}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1c69d4] hover:text-[#1557b3]"
                        >
                          Read page
                          <ArrowRight className="h-4 w-4" />
                        </PublicLink>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LegalHubPage;
