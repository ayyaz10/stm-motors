import { ExternalLink, LoaderCircle, MapPinned, ShieldCheck } from "lucide-react";
import type { DerivedJobProgressStatus } from "../../lib/jobProgress";
import { canViewJobLocation } from "../../lib/jobProgress";
import {
  buildBookingAddressLine,
  buildBookingAddressParts,
  buildGoogleMapsUrl,
  type BookingLocationAddress,
} from "../../lib/bookingLocation";
import MechanicLocationMap from "./MechanicLocationMap";

interface MechanicLocationCardProps {
  location: BookingLocationAddress;
  status: DerivedJobProgressStatus;
  isRefreshing?: boolean;
}

function MechanicLocationCard({
  location,
  status,
  isRefreshing = false,
}: MechanicLocationCardProps) {
  const isVisible = canViewJobLocation(status);
  const hasCoordinates =
    typeof location.latitude === "number" && typeof location.longitude === "number";
  const addressParts = buildBookingAddressParts(location);
  const addressLine = buildBookingAddressLine(location);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
          <MapPinned className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Location
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Customer location
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Use the saved location to navigate to the customer safely.
          </p>
        </div>
      </div>

      {!isVisible ? (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
            <p>Location is no longer available for this job.</p>
          </div>
        </div>
      ) : isRefreshing ? (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" />
            <p>Loading customer map location...</p>
          </div>
        </div>
      ) : addressParts.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
          Customer address is missing for this booking.
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Full address
            </p>
            <div className="mt-2 space-y-1">
              {addressParts.map((part) => (
                <p key={part}>{part}</p>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Postcode
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {location.postcode || "Not available"}
            </p>
          </div>

          <div className="mt-4">
            {hasCoordinates ? (
              <MechanicLocationMap
                latitude={location.latitude!}
                longitude={location.longitude!}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                Saved map coordinates are not available yet. You can still open
                this address in Google Maps.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href={buildGoogleMapsUrl(location)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Open in Google Maps
              <ExternalLink className="h-4 w-4" />
            </a>
            {!hasCoordinates ? (
              <div className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-600">
                Address fallback: {addressLine}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export default MechanicLocationCard;
