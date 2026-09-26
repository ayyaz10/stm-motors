import { ArrowRight, BadgePoundSterling, CarFront, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import MarketplaceFaqSection from "../../components/marketplace/MarketplaceFaqSection";
import MarketplaceVehicleCard from "../../components/marketplace/MarketplaceVehicleCard";
import PublicLink from "../../components/public/PublicLink";
import { fetchMarketplaceListings, type MarketplaceVehicleListing } from "../../lib/marketplace";
import { usePageMetadata } from "../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../lib/siteMode";

const marketplaceBenefits = [
  { icon: Search, title: "Clear listings", text: "Useful vehicle details and photos in one place." },
  { icon: ShieldCheck, title: "Direct enquiries", text: "Speak directly to STM Motors before deciding." },
  { icon: BadgePoundSterling, title: "Sell simply", text: "Send your car details privately for our team to review." },
];

function MarketplaceHomePage() {
  const [featured, setFeatured] = useState<MarketplaceVehicleListing[]>([]);
  const [loadError, setLoadError] = useState("");
  usePageMetadata({
    title: "Cars for Sale & Sell Your Car | STM Motors",
    description: "Browse used cars from STM Motors or send us the details of a car you would like to sell.",
    pathname: "/",
    canonicalOrigin: MARKETPLACE_SITE_ORIGIN,
    structuredData: { "@context": "https://schema.org", "@type": "AutoDealer", name: "STM Motors", url: MARKETPLACE_SITE_ORIGIN },
  });

  useEffect(() => {
    let active = true;
    fetchMarketplaceListings({ pageSize: 3, sort: "newest" })
      .then((result) => { if (active) setFeatured(result.listings); })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : "Unable to load cars."); });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(28,105,212,0.38),transparent_36%),radial-gradient(circle_at_10%_90%,rgba(59,130,246,0.2),transparent_30%)]" />
        <div className="relative mx-auto max-w-[90rem] px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">Buy or sell your car with confidence.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Browse clearly presented used vehicles, enquire directly with our team, or tell us about a car you would like to sell.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PublicLink href="/cars" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 font-semibold text-white hover:bg-[#1557b3]">Browse Cars <ArrowRight className="h-4 w-4" /></PublicLink>
              <PublicLink href="/sell-your-car" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 font-semibold hover:bg-white hover:text-slate-950">Sell Your Car</PublicLink>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-12 lg:py-16">
        <div className="mx-auto grid max-w-[90rem] gap-5 px-5 md:grid-cols-3 lg:px-8">
          {marketplaceBenefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="border-l-4 border-[#1c69d4] bg-slate-50 p-6">
              <Icon className="h-7 w-7 text-[#1c69d4]" />
              <h2 className="mt-4 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-3xl font-bold sm:text-4xl">Latest cars</h2>
            <PublicLink href="/cars" className="font-semibold text-[#1c69d4]">View all cars →</PublicLink>
          </div>
          {loadError ? <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{loadError}</p> : null}
          {featured.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{featured.map((vehicle) => <MarketplaceVehicleCard key={vehicle.id} vehicle={vehicle} />)}</div>
          ) : !loadError ? (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><CarFront className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-4 text-xl font-bold">New stock is being prepared</h3><p className="mt-2 text-slate-600">Check back soon or contact us with the car you are looking for.</p></div>
          ) : null}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-5 lg:grid-cols-2 lg:px-8">
          <div className="rounded-3xl bg-blue-50 p-8"><CarFront className="h-9 w-9 text-[#1c69d4]" /><h2 className="mt-5 text-3xl font-bold">Have a car to sell?</h2><p className="mt-4 leading-7 text-slate-600">Share the vehicle details and optional photos. This starts a review, not a binding valuation or offer.</p><PublicLink href="/sell-your-car" className="mt-6 inline-flex rounded-xl bg-[#1c69d4] px-5 py-3 font-semibold text-white">Start your submission</PublicLink></div>
          <div className="rounded-3xl bg-slate-950 p-8 text-white"><ShieldCheck className="h-9 w-9 text-blue-300" /><h2 className="mt-5 text-3xl font-bold">Need servicing instead?</h2><p className="mt-4 leading-7 text-slate-300">STM Motors servicing and mobile repairs remain on our dedicated service website.</p><a href="https://stmmotors.com/book" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">Book at stmmotors.com</a></div>
        </div>
      </section>

      <MarketplaceFaqSection />
    </div>
  );
}

export default MarketplaceHomePage;
