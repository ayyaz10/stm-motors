import { ArrowRight, CalendarDays, FileText } from "lucide-react";
import { useEffect, useMemo } from "react";
import PublicLink from "../components/public/PublicLink";
import {
  buildLegalTermsHref,
  groupedLegalPages,
  legalPages,
} from "../data/legalPages";
import { navigateTo } from "../lib/navigation";
import { usePageMetadata } from "../lib/seo";

interface TermsPageProps {
  currentHash?: string;
  legacySectionId?: string | null;
  currentPathname: string;
}

function TermsPage({
  currentHash = "",
  legacySectionId = null,
  currentPathname,
}: TermsPageProps) {
  const activeSectionId = useMemo(() => {
    const hashValue = currentHash.replace(/^#/, "").trim();

    if (hashValue) {
      return hashValue;
    }

    if (legacySectionId?.trim()) {
      return legacySectionId.trim();
    }

    return legalPages[0]?.id ?? "";
  }, [currentHash, legacySectionId]);

  usePageMetadata({
    title: "Terms, Policies & Legal Information | STM Motors",
    description:
      "Read STM Motors terms, privacy policy, cookie policy, booking conditions, cancellations, warranty information, complaints guidance, and website legal information in one place.",
    pathname: currentPathname === "/terms" ? "/terms" : "/terms",
  });

  useEffect(() => {
    if (!activeSectionId) {
      return;
    }

    const scrollToSection = () => {
      const element = document.getElementById(activeSectionId);

      if (!element) {
        return;
      }

      element.scrollIntoView({
        behavior: currentHash || legacySectionId ? "smooth" : "auto",
        block: "start",
      });
    };

    const frame = window.requestAnimationFrame(scrollToSection);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeSectionId, currentHash, legacySectionId]);

  const handleJumpToSection = (sectionId: string) => {
    navigateTo(buildLegalTermsHref(sectionId));
  };

  return (
    <div className="w-full bg-white pt-20">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-14">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1c69d4]">
              General Information
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 lg:text-[3.25rem]">
              STM Motors terms and conditions
            </h1>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-4 py-2 text-sm font-medium text-slate-600">
              <CalendarDays className="h-4 w-4 text-[#1c69d4]" />
              Latest policy update 4 September 2026
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-12">
          <div className="mb-8 rounded-[1.5rem] border border-blue-100 bg-slate-50/90 p-5 lg:hidden">
            <label
              htmlFor="terms-jump"
              className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-[#1c69d4]"
            >
              Jump to section
            </label>
            <select
              id="terms-jump"
              value={activeSectionId}
              onChange={(event) => handleJumpToSection(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#1c69d4] focus:ring-2 focus:ring-blue-100"
            >
              {groupedLegalPages.flatMap((group) =>
                group.pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {group.category} - {page.title}
                  </option>
                )),
              )}
            </select>
          </div>

          <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19.5rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-[1.75rem] border border-blue-100 bg-slate-50/85 p-6 shadow-[0_28px_60px_-52px_rgba(15,23,42,0.28)]">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1c69d4]">
                  On this page
                </p>

                <div className="mt-6 space-y-7">
                  {groupedLegalPages.map((group) => (
                    <div key={group.category}>
                      <h2 className="text-[1.05rem] font-semibold leading-7 text-slate-950">
                        {group.category}
                      </h2>
                      <div className="mt-3 grid gap-1.5">
                        {group.pages.map((page) => {
                          const isActive = activeSectionId === page.id;

                          return (
                            <button
                              key={page.id}
                              type="button"
                              onClick={() => handleJumpToSection(page.id)}
                              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                                isActive
                                  ? "bg-white font-semibold text-[#1c69d4] shadow-sm"
                                  : "text-slate-600 hover:bg-white hover:text-[#1c69d4]"
                              }`}
                            >
                              {page.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-[0_28px_70px_-58px_rgba(15,23,42,0.28)] lg:px-8 lg:py-9">
                <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
                  <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1c69d4]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      Terms and conditions
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 lg:text-[15px]">
                      This page sets out the main terms, policies, and general
                      information that apply to STM Motors services and website
                      use.
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-10">
                  {legalPages.map((page, pageIndex) => (
                    <section
                      key={page.id}
                      id={page.id}
                      className="scroll-mt-32 border-b border-slate-200 pb-10 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-10 min-w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-[#1c69d4]">
                          {pageIndex + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-semibold tracking-tight text-slate-950 lg:text-[2rem]">
                              {page.title}
                            </h3>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {page.category}
                            </span>
                          </div>
                          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 lg:text-[15px]">
                            {page.summary}
                          </p>
                          <p className="mt-2 text-xs font-medium text-slate-500">Updated {page.lastUpdated}</p>
                        </div>
                      </div>

                      <div className="mt-7 space-y-6 pl-0 lg:pl-14">
                        {page.sections.map((section, sectionIndex) => (
                          <article key={`${page.id}-${section.title}`}>
                            <div className="flex items-start gap-3">
                              <span className="mt-1 text-sm font-semibold text-[#1c69d4]">
                                {pageIndex + 1}.{sectionIndex + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xl font-semibold text-slate-950">
                                  {section.title}
                                </h4>

                                {section.paragraphs?.map((paragraph) => (
                                  <p
                                    key={paragraph}
                                    className="mt-3 text-sm leading-7 text-slate-600 lg:text-[15px]"
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
                                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/85 px-4 py-4 text-sm leading-7 text-[#1557b3]">
                                    {section.note}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-blue-100 bg-gradient-to-r from-[#1c69d4] to-[#1557b3] p-8 text-white shadow-[0_28px_60px_-40px_rgba(28,105,212,0.36)]">
                <h2 className="text-2xl font-semibold">
                  Need clarification before booking?
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 lg:text-[15px]">
                  If you have a question about a live booking, a cancellation,
                  privacy, warranty, or a service detail, contact STM Motors and
                  we will guide you to the right next step.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <PublicLink
                    href="/contact"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#1c69d4] hover:bg-blue-50"
                  >
                    Contact Us
                    <ArrowRight className="h-4 w-4" />
                  </PublicLink>
                  <PublicLink
                    href="/book"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/24 px-5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Start a booking
                  </PublicLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsPage;
