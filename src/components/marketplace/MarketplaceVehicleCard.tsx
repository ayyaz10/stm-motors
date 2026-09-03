import { CalendarDays, Fuel, Gauge, Settings2 } from "lucide-react";
import {
  formatMarketplaceMileage,
  formatMarketplacePrice,
  getMarketplaceListingImageUrl,
  type MarketplaceVehicleListing,
} from "../../lib/marketplace";
import PublicLink from "../public/PublicLink";

const statusStyles = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  reserved: "bg-amber-50 text-amber-800 ring-amber-200",
  sold: "bg-slate-100 text-slate-700 ring-slate-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  archived: "bg-slate-100 text-slate-700 ring-slate-200",
};

function MarketplaceVehicleCard({ vehicle }: { vehicle: MarketplaceVehicleListing }) {
  const cover = vehicle.images[0];
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 hover:shadow-lg">
      <PublicLink href={`/cars/${vehicle.slug}`} className="relative aspect-[3/2] overflow-hidden bg-slate-100">
        <img src={getMarketplaceListingImageUrl(cover?.storage_path ?? "")} alt={cover?.alt_text || title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[vehicle.status]}`}>{vehicle.status === "published" ? "Available" : vehicle.status}</span>
      </PublicLink>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1c69d4]">{vehicle.make}</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">{vehicle.model}</h2>
        {vehicle.derivative ? <p className="mt-1 text-sm text-slate-600">{vehicle.derivative}</p> : null}
        <p className="mt-4 text-2xl font-bold text-slate-950">{formatMarketplacePrice(vehicle.price)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 text-sm text-slate-600">
          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#1c69d4]" />{vehicle.year}</span>
          <span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-[#1c69d4]" />{formatMarketplaceMileage(vehicle.mileage)}</span>
          <span className="flex items-center gap-2"><Fuel className="h-4 w-4 text-[#1c69d4]" />{vehicle.fuel_type}</span>
          <span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-[#1c69d4]" />{vehicle.transmission}</span>
        </div>
        <PublicLink href={`/cars/${vehicle.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1c69d4] px-4 text-sm font-semibold text-white hover:bg-[#1557b3]">View Details</PublicLink>
      </div>
    </article>
  );
}

export default MarketplaceVehicleCard;

