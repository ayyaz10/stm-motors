import {
  ExternalLink,
  Image,
  LoaderCircle,
  RefreshCw,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createSellerImageSignedUrl,
  fetchMarketplaceEnquiries,
  fetchMarketplaceSellSubmissions,
  formatMarketplaceMileage,
  formatMarketplacePrice,
  updateMarketplaceEnquiry,
  type MarketplaceEnquiryStatus,
  type MarketplaceSellSubmission,
  type MarketplaceVehicleEnquiry,
} from "../../../lib/marketplace";
import { usePageMetadata } from "../../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../../lib/siteMode";

const statuses: MarketplaceEnquiryStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "completed",
  "closed",
];

function MarketplaceEnquiriesAdminPage({
  mode,
}: {
  mode: "purchase" | "sell";
}) {
  const [records, setRecords] = useState<
    Array<MarketplaceVehicleEnquiry | MarketplaceSellSubmission>
  >([]);
  const [drafts, setDrafts] = useState<
    Record<string, { status: MarketplaceEnquiryStatus; notes: string }>
  >({});
  const [filter, setFilter] = useState<MarketplaceEnquiryStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const isSell = mode === "sell";
  const path = isSell ? "/admin/sell-submissions" : "/admin/enquiries";
  usePageMetadata({
    title: `${isSell ? "Sell Submissions" : "Purchase Enquiries"} | STM Motors`,
    description: "STM Motors marketplace enquiry administration.",
    pathname: path,
    canonicalOrigin: MARKETPLACE_SITE_ORIGIN,
    noIndex: true,
  });
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const next = isSell
        ? await fetchMarketplaceSellSubmissions()
        : await fetchMarketplaceEnquiries();
      setRecords(next);
      setDrafts(
        Object.fromEntries(
          next.map((record) => [
            record.id,
            { status: record.status, notes: record.internal_notes ?? "" },
          ]),
        ),
      );
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load enquiries.",
      );
    } finally {
      setLoading(false);
    }
  }, [isSell]);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      filter === "all"
        ? records
        : records.filter((record) => record.status === filter),
    [filter, records],
  );
  const save = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    try {
      setBusyId(id);
      await updateMarketplaceEnquiry(
        isSell
          ? "marketplace_sell_submissions"
          : "marketplace_vehicle_enquiries",
        id,
        draft.status,
        draft.notes,
      );
      setRecords((current) =>
        current.map((record) =>
          record.id === id
            ? {
                ...record,
                status: draft.status,
                internal_notes: draft.notes || null,
                contacted_at:
                  draft.status === "contacted"
                    ? new Date().toISOString()
                    : record.contacted_at,
              }
            : record,
        ),
      );
      setError("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update enquiry.",
      );
    } finally {
      setBusyId("");
    }
  };
  const openPrivateImage = async (pathValue: string) => {
    try {
      const url = await createSellerImageSignedUrl(pathValue);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "Unable to open private image.",
      );
    }
  };
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1c69d4]">
            Marketplace inbox
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {isSell
              ? "Sell-your-car submissions"
              : "Vehicle purchase enquiries"}
          </h1>
          <p className="mt-2 text-slate-600">
            Customer data is visible only to authorised ops and admin staff.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
      <div className="mt-7 flex flex-wrap gap-2">
        {(["all", ...statuses] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${filter === value ? "bg-[#1c69d4] text-white" : "border border-slate-300 bg-white text-slate-700"}`}
          >
            {value.replaceAll("_", " ")}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#1c69d4]" />
        </div>
      ) : (
        <div className="mt-6 grid gap-5">
          {filtered.map((record) => {
            const sell = isSell ? (record as MarketplaceSellSubmission) : null;
            const purchase = !isSell
              ? (record as MarketplaceVehicleEnquiry)
              : null;
            const draft = drafts[record.id] ?? {
              status: record.status,
              notes: record.internal_notes ?? "",
            };
            return (
              <article
                key={record.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1c69d4]">
                        {record.reference}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">
                        {record.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-bold">
                      {sell
                        ? `${sell.year} ${sell.make} ${sell.model}`
                        : purchase?.vehicle_title_snapshot}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Received{" "}
                      {new Date(record.created_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold">{record.name}</p>
                    <a
                      href={`mailto:${record.email}`}
                      className="mt-1 block text-[#1c69d4]"
                    >
                      {record.email}
                    </a>
                    {record.phone ? (
                      <a
                        href={`tel:${record.phone}`}
                        className="mt-1 block text-[#1c69d4]"
                      >
                        {record.phone}
                      </a>
                    ) : null}
                    <p className="mt-1 text-slate-500">
                      Prefers {record.preferred_contact}
                    </p>
                  </div>
                </div>
                {purchase ? (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
                    <p>
                      <strong>Price snapshot:</strong>{" "}
                      {formatMarketplacePrice(
                        Number(purchase.displayed_price_snapshot),
                      )}
                    </p>
                    <p className="mt-3 whitespace-pre-line leading-6 text-slate-700">
                      {purchase.message}
                    </p>
                    <a
                      href={`/cars/${purchase.listing_slug_snapshot}`}
                      className="mt-3 inline-flex items-center gap-1 font-semibold text-[#1c69d4]"
                    >
                      Open listing <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
                {sell ? (
                  <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                    <p>
                      <strong>Registration:</strong>
                      <br />
                      {sell.registration_number}
                    </p>
                    <p>
                      <strong>Mileage:</strong>
                      <br />
                      {formatMarketplaceMileage(sell.mileage)}
                    </p>
                    <p>
                      <strong>Postcode:</strong>
                      <br />
                      {sell.postcode}
                    </p>
                    <p>
                      <strong>Finance:</strong>
                      <br />
                      <span className="capitalize">
                        {sell.outstanding_finance}
                      </span>
                    </p>
                    <p className="md:col-span-2">
                      <strong>Condition:</strong>
                      <br />
                      <span className="whitespace-pre-line leading-6">
                        {sell.condition}
                      </span>
                    </p>
                    <p className="md:col-span-2">
                      <strong>Known faults:</strong>
                      <br />
                      <span className="whitespace-pre-line leading-6">
                        {sell.known_faults || "None stated"}
                      </span>
                    </p>
                    {sell.marketplace_sell_submission_images?.length ? (
                      <div className="md:col-span-2 lg:col-span-4">
                        <strong>Private photos</strong>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sell.marketplace_sell_submission_images.map(
                            (image, index) => (
                              <button
                                key={image.id}
                                type="button"
                                onClick={() =>
                                  void openPrivateImage(image.storage_path)
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                              >
                                <Image className="h-4 w-4" />
                                Photo {index + 1}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-[13rem_1fr_auto]">
                  <label className="text-sm font-semibold">
                    Status
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [record.id]: {
                            ...draft,
                            status: e.target.value as MarketplaceEnquiryStatus,
                          },
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"
                    >
                      {statuses.map((value) => (
                        <option key={value} value={value}>
                          {value.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Internal notes
                    <textarea
                      rows={3}
                      value={draft.notes}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [record.id]: { ...draft, notes: e.target.value },
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busyId === record.id}
                    onClick={() => void save(record.id)}
                    className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-4 font-semibold text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </article>
            );
          })}
          {!filtered.length ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              No records in this view.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default MarketplaceEnquiriesAdminPage;
