import { Clock3, Mail, Menu, Phone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { buildLegalTermsHref } from "../../data/legalPages";
import { contactDetails } from "../../data/siteContent";
import { STAFF_SITE_ORIGIN } from "../../lib/siteMode";
import { useCookieConsent } from "../privacy/CookieConsentContext";
import PublicLink from "./PublicLink";
import PublicLogo from "./PublicLogo";

interface PublicLayoutProps {
  children: ReactNode;
  currentPath: string;
}

function PublicLayout({ children, currentPath }: PublicLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openPreferences } = useCookieConsent();

  const normalizedPath = useMemo(() => {
    if (currentPath === "/carselection") {
      return "/book";
    }

    if (currentPath.startsWith("/services/")) {
      return "/services";
    }

    if (currentPath.startsWith("/cars-for-sale/")) {
      return "/cars-for-sale";
    }

    return currentPath;
  }, [currentPath]);

  const isHomepage = normalizedPath === "/";
  const phoneHref = `tel:${contactDetails.phone.replace(/\s+/g, "")}`;
  const emailHref = `mailto:${contactDetails.email}`;
  const homepageNavItems = [
    { label: "How It Works", href: "#how-it-works", isAnchor: true },
    { label: "Services", href: "#services", isAnchor: true },
    { label: "Buy & Sell Cars", href: "https://stmmotors.co.uk", isAnchor: false },
    { label: "Our Team", href: "#team", isAnchor: true },
    { label: "Why Choose Us", href: "#why-choose-us", isAnchor: true },
    { label: "FAQ", href: "#faq", isAnchor: true },
    { label: "For Mechanics", href: "/mechanic/apply", isAnchor: false },
  ];
  const standardNavItems = [
    { label: "Home", href: "/", isAnchor: false },
    { label: "Services", href: "/services", isAnchor: false },
    { label: "Buy & Sell Cars", href: "https://stmmotors.co.uk", isAnchor: false },
    { label: "About", href: "/about", isAnchor: false },
    { label: "Contact", href: "/contact", isAnchor: false },
    { label: "For Mechanics", href: "/mechanic/apply", isAnchor: false },
  ];
  const navItems = isHomepage ? homepageNavItems : standardNavItems;
  const footerCompanyLinks = [
    {
      label: "How It Works",
      href: isHomepage ? "#how-it-works" : "/#how-it-works",
      isAnchor: true,
    },
    {
      label: "Our Team",
      href: isHomepage ? "#team" : "/#team",
      isAnchor: true,
    },
    {
      label: "Why Choose Us",
      href: isHomepage ? "#why-choose-us" : "/#why-choose-us",
      isAnchor: true,
    },
    {
      label: "FAQ",
      href: isHomepage ? "#faq" : "/#faq",
      isAnchor: true,
    },
    { label: "For Mechanics", href: "/mechanic/apply", isAnchor: false },
    { label: "Buy & Sell Cars", href: "https://stmmotors.co.uk", isAnchor: false },
    { label: "Contact", href: "/contact", isAnchor: false },
    { label: "Staff Login", href: `${STAFF_SITE_ORIGIN}/login`, isAnchor: false },
    {
      label: "Terms & Conditions",
      href: buildLegalTermsHref(),
      isAnchor: false,
    },
  ];
  const footerPopularServices = [
    { label: "Brake pads replacement", href: "/services/brake-pads-replacement-front" },
    { label: "Disc and pad replacement", href: "/services/disc-and-pad-replacement-front" },
    { label: "Engine oil and filter", href: "/services/engine-oil-and-filter" },
    { label: "Full service", href: "/services/full-service" },
    { label: "Engine diagnostic service", href: "/services/engine-diagnostic-service" },
    { label: "Heating and air conditioning", href: "/services/heating-and-air-conditioning" },
  ];

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const { overflow } = document.body.style;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="public-page-shell bg-white">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-[90rem] px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            <PublicLink href="/" className="flex shrink-0 items-center">
              <PublicLogo />
            </PublicLink>

            <div className="hidden items-center gap-1 xl:flex">
              {navItems.map((link) =>
                link.isAnchor ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="whitespace-nowrap rounded-xl px-3 py-2 text-[0.9375rem] font-semibold text-slate-600 transition-colors hover:text-[#1c69d4]"
                  >
                    {link.label}
                  </a>
                ) : (
                  <PublicLink
                    key={link.href}
                    href={link.href}
                    className={`whitespace-nowrap rounded-xl px-3 py-2 text-[0.9375rem] font-semibold transition-colors ${
                      normalizedPath === link.href
                        ? "text-[#1c69d4]"
                        : "text-slate-600 hover:text-[#1c69d4]"
                    }`}
                  >
                    {link.label}
                  </PublicLink>
                ),
              )}
            </div>

            <div className="hidden shrink-0 items-center gap-3 xl:flex">
              {isHomepage ? (
                <PublicLink
                  href="/book"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 text-[0.9375rem] font-semibold text-white hover:bg-[#1557b3]"
                >
                  Get Quote
                </PublicLink>
              ) : (
                <PublicLink
                  href="/book"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 text-[0.9375rem] font-semibold text-white hover:bg-[#1557b3]"
                >
                  Book Service
                </PublicLink>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 xl:hidden"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-site-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div
          id="mobile-site-menu"
          className={`fixed inset-0 z-[70] transition-opacity duration-300 xl:hidden ${
            isMobileMenuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-slate-950/34 backdrop-blur-[2px]"
          />

          <div
            className={`absolute inset-0 flex min-h-dvh w-full flex-col overflow-y-auto bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.32)] will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <PublicLink href="/" className="flex shrink-0 items-center" onClick={closeMobileMenu}>
                <PublicLogo />
              </PublicLink>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 py-6">
              <div className="grid gap-2">
                {navItems.map((link) =>
                  link.isAnchor ? (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="rounded-xl px-4 py-3 text-left text-[0.9375rem] font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1c69d4]"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <PublicLink
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="rounded-xl px-4 py-3 text-left text-[0.9375rem] font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1c69d4]"
                    >
                      {link.label}
                    </PublicLink>
                  ),
                )}
              </div>

              <div className="mt-8 grid gap-3">
                {isHomepage ? (
                  <PublicLink
                    href="/book"
                    onClick={closeMobileMenu}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1c69d4] px-5 text-[0.9375rem] font-semibold text-white hover:bg-[#1557b3]"
                  >
                    Get Quote
                  </PublicLink>
                ) : (
                  <PublicLink
                    href="/book"
                    onClick={closeMobileMenu}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1c69d4] px-5 text-[0.9375rem] font-semibold text-white hover:bg-[#1557b3]"
                  >
                    Book Service
                  </PublicLink>
                )}
              </div>

              <div className="mt-auto pt-10">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
                    STM Motors
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Mobile vehicle services and a straightforward way to browse
                    or sell a used car.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.85fr_0.9fr]">
            <div className="text-left">
              <PublicLink href="/" className="inline-flex items-center">
                <PublicLogo light />
              </PublicLink>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
                STM Motors provides mobile vehicle services alongside a clear,
                professional way to buy or sell a used car.
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <a
                  href={phoneHref}
                  className="flex items-center gap-3 hover:text-white"
                >
                  <Phone className="h-4 w-4 text-blue-300" />
                  <span>{contactDetails.phone}</span>
                </a>
                <a
                  href={emailHref}
                  className="flex items-center gap-3 hover:text-white"
                >
                  <Mail className="h-4 w-4 text-blue-300" />
                  <span>{contactDetails.email}</span>
                </a>
                <p className="flex items-center gap-3">
                  <Clock3 className="h-4 w-4 text-blue-300" />
                  <span>{contactDetails.openingHours}</span>
                </p>
              </div>
            </div>

            <div className="text-left">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Popular Services
              </h3>
              <ul className="mt-5 space-y-3">
                {footerPopularServices.map((service) => (
                  <li key={service.href}>
                    <PublicLink
                      href={service.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {service.label}
                    </PublicLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-left">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Company
              </h3>
              <ul className="mt-5 space-y-3">
                {footerCompanyLinks.map((link) => (
                  <li key={link.label}>
                    {link.isAnchor ? (
                      <a
                        href={link.href}
                        className="text-sm text-slate-300 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <PublicLink
                        href={link.href}
                        className="text-sm text-slate-300 transition-colors hover:text-white"
                      >
                        {link.label}
                      </PublicLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-left">
            <div className="flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <p>&copy; 2026 STM Motors. All rights reserved.</p>
                <p>
                  Powered by{" "}
                  <a
                    href="https://stmconsultinggorup.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-slate-600 underline-offset-4 transition hover:text-white"
                  >
                    STM Consulting Group, an IT consulting company
                  </a>
                  .
                </p>
              </div>
              <button type="button" onClick={openPreferences} className="w-fit underline decoration-slate-600 underline-offset-4 transition hover:text-white">Cookie settings</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
