import { Clock3, Mail, Menu, Phone, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { contactDetails } from "../../data/siteContent";
import { SERVICE_SITE_ORIGIN, STAFF_SITE_ORIGIN } from "../../lib/siteMode";
import PublicLink from "../public/PublicLink";
import PublicLogo from "../public/PublicLogo";
import { useCookieConsent } from "../privacy/CookieConsentContext";

function MarketplaceLayout({ children, currentPath }: { children: ReactNode; currentPath: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openPreferences } = useCookieConsent();
  const normalizedPath = currentPath.startsWith("/cars/") ? "/cars" : currentPath;
  const links = [
    { label: "Home", href: "/" },
    { label: "Cars for Sale", href: "/cars" },
    { label: "Sell Your Car", href: "/sell-your-car" },
    { label: "Contact", href: "/contact" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <a href="#marketplace-main" className="skip-link">Skip to content</a>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 lg:h-20 lg:px-8">
          <PublicLink href="/" className="flex shrink-0 items-center"><PublicLogo /></PublicLink>
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Vehicle marketplace">
            {links.map((link) => (
              <PublicLink
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-[0.9375rem] font-semibold ${normalizedPath === link.href ? "text-[#1c69d4]" : "text-slate-600 hover:text-[#1c69d4]"}`}
              >
                {link.label}
              </PublicLink>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-3 xl:flex">
            <a href={`${SERVICE_SITE_ORIGIN}/book`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-[0.9375rem] font-semibold text-slate-700 hover:border-[#1c69d4] hover:text-[#1c69d4]">Book a Service</a>
            <PublicLink href="/cars" className="rounded-xl bg-[#1c69d4] px-5 py-2.5 text-[0.9375rem] font-semibold text-white hover:bg-[#1557b3]">Browse Cars</PublicLink>
          </div>
          <button type="button" onClick={() => setMenuOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 xl:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70] bg-white p-5 xl:hidden">
          <div className="flex items-center justify-between"><PublicLogo /><button type="button" onClick={() => setMenuOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
          <nav className="mt-8 grid gap-2">
            {links.map((link) => <PublicLink key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-4 text-[0.9375rem] font-semibold text-slate-800 hover:bg-blue-50">{link.label}</PublicLink>)}
            <a href={`${SERVICE_SITE_ORIGIN}/book`} className="mt-4 rounded-xl bg-slate-950 px-4 py-4 text-center text-[0.9375rem] font-semibold text-white">Book a Service on .com</a>
          </nav>
        </div>
      ) : null}

      <main id="marketplace-main" className="min-h-[70vh] pt-16 lg:pt-20">{children}</main>
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-14 md:grid-cols-3 lg:px-8">
          <div><PublicLogo light /><p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Straightforward used car buying and selling enquiries from STM Motors.</p></div>
          <div><h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Marketplace</h2><div className="mt-5 grid gap-3 text-sm text-slate-300"><PublicLink href="/cars">Cars for sale</PublicLink><PublicLink href="/sell-your-car">Sell your car</PublicLink><PublicLink href="/contact">Contact sales</PublicLink><a href={`${SERVICE_SITE_ORIGIN}/book`}>Book servicing</a><a href={`${STAFF_SITE_ORIGIN}/login`}>Staff Login</a></div></div>
          <div><h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Contact</h2><div className="mt-5 grid gap-3 text-sm text-slate-300"><a className="flex items-center gap-3" href={`tel:${contactDetails.phone.replace(/\s+/g, "")}`}><Phone className="h-4 w-4 text-blue-300" />{contactDetails.phone}</a><a className="flex items-center gap-3" href={`mailto:${contactDetails.email}`}><Mail className="h-4 w-4 text-blue-300" />{contactDetails.email}</a><p className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-blue-300" />{contactDetails.openingHours}</p></div></div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-xs text-slate-400"><div className="mx-auto flex max-w-[90rem] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:px-3"><div className="flex flex-col gap-2"><p>&copy; 2026 STM Motors. Vehicle availability and details are confirmed before sale.</p><p>Powered by <a href="https://stmconsultinggorup.com" target="_blank" rel="noreferrer" className="underline decoration-slate-600 underline-offset-4 hover:text-white">STM Consulting Group, an IT consulting company</a>.</p></div><button type="button" onClick={openPreferences} className="w-fit underline decoration-slate-600 underline-offset-4 hover:text-white">Cookie settings</button></div></div>
      </footer>
    </div>
  );
}

export default MarketplaceLayout;
