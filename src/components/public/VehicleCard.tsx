import {
  CalendarDays,
  Fuel,
  Gauge,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import type { DealershipVehicle } from "../../data/dealershipVehicles";
import {
  buildPurchaseEnquiryUrl,
  formatVehicleMileage,
  formatVehiclePrice,
} from "../../data/dealershipVehicles";
import PublicLink from "./PublicLink";

interface VehicleCardProps {
  vehicle: DealershipVehicle;
}

const statusStyles = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Reserved: "bg-amber-50 text-amber-800 ring-amber-200",
  Sold: "bg-slate-100 text-slate-600 ring-slate-200",
};

function VehicleCard({ vehicle }: VehicleCardProps) {
  const isSold = vehicle.status === "Sold";
  const specifications = [
    { icon: CalendarDays, label: String(vehicle.year) },
    { icon: Gauge, label: formatVehicleMileage(vehicle.mileage) },
    { icon: Fuel, label: vehicle.fuelType },
    { icon: Settings2, label: vehicle.transmission },
    { icon: SlidersHorizontal, label: vehicle.engineSize },
  ];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          loading="lazy"
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[vehicle.status]}`}
        >
          {vehicle.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1c69d4]">
              {vehicle.make}
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {vehicle.model}
            </h3>
          </div>
          <p className="shrink-0 text-xl font-bold text-slate-950">
            {formatVehiclePrice(vehicle.price)}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-100 py-4">
          {specifications.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#1c69d4]" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
          {vehicle.description}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
          <PublicLink
            href={`/cars-for-sale/${vehicle.slug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-[#1c69d4] hover:bg-blue-50 hover:text-[#1c69d4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            View Details
          </PublicLink>
          {isSold ? (
            <span
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-500"
              aria-label={`${vehicle.make} ${vehicle.model} is sold`}
            >
              Sold
            </span>
          ) : (
            <PublicLink
              href={buildPurchaseEnquiryUrl(vehicle)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1c69d4] px-3 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              Enquire Now
            </PublicLink>
          )}
        </div>
      </div>
    </article>
  );
}

export default VehicleCard;
