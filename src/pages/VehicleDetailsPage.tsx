import {
  ArrowLeft,
  CalendarDays,
  Check,
  Fuel,
  Gauge,
  Info,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import PublicLink from "../components/public/PublicLink";
import {
  buildPurchaseEnquiryUrl,
  findDealershipVehicle,
  formatVehicleMileage,
  formatVehiclePrice,
} from "../data/dealershipVehicles";
import { usePageMetadata } from "../lib/seo";

interface VehicleDetailsPageProps {
  slug: string;
}

const detailStatusStyles = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Reserved: "bg-amber-50 text-amber-800 ring-amber-200",
  Sold: "bg-slate-100 text-slate-700 ring-slate-200",
};

function VehicleDetailsPage({ slug }: VehicleDetailsPageProps) {
  const vehicle = findDealershipVehicle(slug);

  usePageMetadata({
    title: vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model} | STM Motors UK`
      : "Vehicle Not Found | STM Motors UK",
    description: vehicle
      ? `${vehicle.description} View specifications and send an enquiry to STM Motors UK.`
      : "This vehicle listing is not available.",
    pathname: `/cars-for-sale/${slug}`,
    imagePath: vehicle?.image,
  });

  if (!vehicle) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-6 pt-20">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Info className="mx-auto h-10 w-10 text-[#1c69d4]" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-bold text-slate-950">Vehicle not found</h1>
          <p className="mt-3 leading-7 text-slate-600">
            This listing may have been removed or the address may be incorrect.
          </p>
          <PublicLink
            href="/cars-for-sale"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            Browse Cars
          </PublicLink>
        </div>
      </div>
    );
  }

  const specifications = [
    { icon: CalendarDays, title: "Registration year", value: String(vehicle.year) },
    { icon: Gauge, title: "Mileage", value: formatVehicleMileage(vehicle.mileage) },
    { icon: Fuel, title: "Fuel type", value: vehicle.fuelType },
    { icon: Settings2, title: "Transmission", value: vehicle.transmission },
    { icon: SlidersHorizontal, title: "Engine size", value: vehicle.engineSize },
  ];
  const isSold = vehicle.status === "Sold";

  return (
    <div className="w-full bg-white pt-16 lg:pt-20">
      <section className="border-b border-slate-200 bg-slate-50 py-6">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <PublicLink
            href="/cars-for-sale"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#1c69d4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all cars
          </PublicLink>
        </div>
      </section>

      <section className="py-10 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
          <div>
            <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)]">
              <img
                src={vehicle.image}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} viewed from the front and side`}
                className="aspect-[3/2] h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Listing images are representative placeholders. Please ask our team for the latest vehicle photographs.
            </p>
          </div>

          <div className="text-left">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${detailStatusStyles[vehicle.status]}`}>
                {vehicle.status}
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
                {vehicle.make}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950 lg:text-5xl">
              {vehicle.model}
            </h1>
            <p className="mt-4 text-3xl font-bold text-[#1c69d4]">
              {formatVehiclePrice(vehicle.price)}
            </p>
            <p className="mt-6 text-base leading-8 text-slate-600">
              {vehicle.description}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {specifications.map(({ icon: Icon, title, value }) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Icon className="h-5 w-5 text-[#1c69d4]" aria-hidden="true" />
                  <p className="mt-3 text-xs font-medium text-slate-500">{title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            {isSold ? (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">This vehicle has been sold</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Purchase enquiries are closed for this vehicle. Browse our current listings to find a similar car.
                </p>
                <PublicLink
                  href="/cars-for-sale"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1c69d4] px-5 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  Browse Available Cars
                </PublicLink>
              </div>
            ) : (
              <PublicLink
                href={buildPurchaseEnquiryUrl(vehicle)}
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:w-auto"
              >
                Enquire About This Car
              </PublicLink>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-12">
          <div className="text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">Vehicle overview</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">A closer look</h2>
            <p className="mt-5 leading-8 text-slate-600">
              This listing brings the key vehicle information together before you enquire. Our team can confirm current availability and discuss any additional details you need.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Vehicle features</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {vehicle.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1c69d4]">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VehicleDetailsPage;
