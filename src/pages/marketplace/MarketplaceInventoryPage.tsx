import { Filter, LoaderCircle, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MarketplaceFaqSection from "../../components/marketplace/MarketplaceFaqSection";
import MarketplaceVehicleCard from "../../components/marketplace/MarketplaceVehicleCard";
import {
  fetchMarketplaceFilterOptions,
  fetchMarketplaceListings,
  type MarketplaceListingFilters,
  type MarketplaceVehicleListing,
} from "../../lib/marketplace";
import { usePageMetadata } from "../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../lib/siteMode";

const pageSize = 12;
const emptyOptions: {
  makes: string[];
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
} = {
  makes: [],
  fuelTypes: [],
  transmissions: [],
  bodyTypes: [],
};

function numericValue(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function MarketplaceInventoryPage() {
  const [draft, setDraft] = useState({
    search: "",
    make: "",
    fuelType: "",
    transmission: "",
    bodyType: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    sort: "newest",
  });
  const [filters, setFilters] = useState<MarketplaceListingFilters>({
    page: 1,
    pageSize,
    sort: "newest",
  });
  const [options, setOptions] = useState(emptyOptions);
  const [listings, setListings] = useState<MarketplaceVehicleListing[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  usePageMetadata({
    title: "Used Cars for Sale | STM Motors",
    description:
      "Browse STM Motors used car inventory and enquire directly about an available vehicle.",
    pathname: "/cars",
    canonicalOrigin: MARKETPLACE_SITE_ORIGIN,
  });

  useEffect(() => {
    fetchMarketplaceFilterOptions()
      .then(setOptions)
      .catch(() => setOptions(emptyOptions));
  }, []);
  useEffect(() => {
    let active = true;
    fetchMarketplaceListings(filters)
      .then((result) => {
        if (active) {
          setListings(result.listings);
          setCount(result.count);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load cars.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  const rangeLabel = useMemo(
    () =>
      count
        ? `${(Number(filters.page ?? 1) - 1) * pageSize + 1}–${Math.min(Number(filters.page ?? 1) * pageSize, count)} of ${count}`
        : "0 vehicles",
    [count, filters.page],
  );
  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFilters({
      search: draft.search,
      make: draft.make,
      fuelType: draft.fuelType,
      transmission: draft.transmission,
      bodyType: draft.bodyType,
      minPrice: numericValue(draft.minPrice),
      maxPrice: numericValue(draft.maxPrice),
      minYear: numericValue(draft.minYear),
      maxYear: numericValue(draft.maxYear),
      sort: draft.sort as MarketplaceListingFilters["sort"],
      page: 1,
      pageSize,
    });
  };
  const resetFilters = () => {
    setLoading(true);
    setDraft({
      search: "",
      make: "",
      fuelType: "",
      transmission: "",
      bodyType: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      sort: "newest",
    });
    setFilters({ page: 1, pageSize, sort: "newest" });
  };

  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 py-14 text-white lg:py-20">
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8">
          <h1 className="text-4xl font-bold sm:text-5xl">Used cars for sale</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Search current STM Motors stock, compare the important details and
            enquire directly.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-[90rem] gap-8 px-5 py-10 lg:grid-cols-[18rem_1fr] lg:px-8 lg:py-14">
        <form
          onSubmit={applyFilters}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Filter className="h-5 w-5 text-[#1c69d4]" />
            Filter cars
          </h2>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold">
              Search
              <input
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                placeholder="Make or model"
              />
            </label>
            {[
              { key: "make", label: "Make", values: options.makes },
              { key: "fuelType", label: "Fuel", values: options.fuelTypes },
              {
                key: "transmission",
                label: "Transmission",
                values: options.transmissions,
              },
              {
                key: "bodyType",
                label: "Body type",
                values: options.bodyTypes,
              },
            ].map(({ key, label, values }) => (
              <label key={key} className="text-sm font-semibold">
                {label}
                <select
                  value={draft[key as keyof typeof draft]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"
                >
                  <option value="">Any</option>
                  {values.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">
                Min price
                <input
                  type="number"
                  min="0"
                  value={draft.minPrice}
                  onChange={(e) =>
                    setDraft({ ...draft, minPrice: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Max price
                <input
                  type="number"
                  min="0"
                  value={draft.maxPrice}
                  onChange={(e) =>
                    setDraft({ ...draft, maxPrice: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">
                Min year
                <input
                  type="number"
                  min="1900"
                  value={draft.minYear}
                  onChange={(e) =>
                    setDraft({ ...draft, minYear: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Max year
                <input
                  type="number"
                  min="1900"
                  value={draft.maxYear}
                  onChange={(e) =>
                    setDraft({ ...draft, maxYear: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
            </div>
            <button className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] font-semibold text-white">
              <Search className="h-4 w-4" />
              Apply filters
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-slate-600"
            >
              Reset filters
            </button>
          </div>
        </form>
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">{rangeLabel}</p>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Sort
              <select
                value={draft.sort}
                onChange={(e) => {
                  const sort = e.target.value;
                  setDraft({ ...draft, sort });
                  setLoading(true);
                  setFilters((current) => ({
                    ...current,
                    sort: sort as MarketplaceListingFilters["sort"],
                    page: 1,
                  }));
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price low to high</option>
                <option value="price_desc">Price high to low</option>
                <option value="mileage_asc">Mileage low to high</option>
                <option value="year_desc">Year newest first</option>
              </select>
            </label>
          </div>
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-[#1c69d4]" />
              <span className="ml-3">Loading vehicles…</span>
            </div>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
              {error}
            </div>
          ) : listings.length ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((vehicle) => (
                <MarketplaceVehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-xl font-bold">No cars match those filters</h2>
              <p className="mt-2 text-slate-600">
                Try widening your search or contact STM Motors.
              </p>
            </div>
          )}
          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                disabled={Number(filters.page) <= 1}
                onClick={() => {
                  setLoading(true);
                  setFilters((current) => ({
                    ...current,
                    page: Number(current.page) - 1,
                  }));
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-semibold">
                Page {filters.page} of {totalPages}
              </span>
              <button
                disabled={Number(filters.page) >= totalPages}
                onClick={() => {
                  setLoading(true);
                  setFilters((current) => ({
                    ...current,
                    page: Number(current.page) + 1,
                  }));
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </div>
      <MarketplaceFaqSection />
    </div>
  );
}

export default MarketplaceInventoryPage;
