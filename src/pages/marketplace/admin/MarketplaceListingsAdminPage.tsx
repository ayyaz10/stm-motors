import { Eye, LoaderCircle, Pencil, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminMarketplaceListings,
  formatMarketplaceMileage,
  formatMarketplacePrice,
  getMarketplaceListingImageUrl,
  type MarketplaceAdminVehicleListing,
} from "../../../lib/marketplace";
import { navigateTo } from "../../../lib/navigation";
import { usePageMetadata } from "../../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../../lib/siteMode";

function MarketplaceListingsAdminPage() {
  const [listings, setListings] = useState<MarketplaceAdminVehicleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  usePageMetadata({ title: "Vehicle Admin | STM Motors", description: "STM Motors vehicle inventory administration.", pathname: "/admin/vehicles", canonicalOrigin: MARKETPLACE_SITE_ORIGIN, noIndex: true });
  const load = async () => { try { setLoading(true); setListings(await fetchAdminMarketplaceListings()); setError(""); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load listings."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => listings.filter((listing) => (status === "all" || listing.status === status) && `${listing.make} ${listing.model} ${listing.derivative ?? ""} ${listing.stock_reference ?? ""}`.toLowerCase().includes(search.toLowerCase())), [listings, search, status]);
  return <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1c69d4]">Inventory management</p><h1 className="mt-2 text-3xl font-bold">Vehicle listings</h1><p className="mt-2 text-slate-600">Draft, publish, reserve, sell or archive STM Motors stock.</p></div><div className="flex gap-3"><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold"><RefreshCw className="h-4 w-4" />Refresh</button><button type="button" onClick={() => navigateTo("/admin/vehicles/new")} className="inline-flex items-center gap-2 rounded-xl bg-[#1c69d4] px-4 py-3 font-semibold text-white"><Plus className="h-4 w-4" />Add vehicle</button></div></div>
    <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_12rem]"><input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Search make, model or stock reference" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="all">All statuses</option>{["draft", "published", "reserved", "sold", "archived"].map((value) => <option key={value}>{value}</option>)}</select></div>
    {loading ? <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#1c69d4]" /></div> : error ? <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</p> : <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500"><tr><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Mileage</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((listing) => <tr key={listing.id}><td className="px-4 py-4"><div className="flex min-w-64 items-center gap-3"><img src={getMarketplaceListingImageUrl(listing.images[0]?.storage_path ?? "")} alt="" className="h-14 w-20 rounded-lg object-cover" /><div><p className="font-bold">{listing.year} {listing.make} {listing.model}</p><p className="text-xs text-slate-500">{listing.stock_reference || "No stock reference"}</p></div></div></td><td className="px-4 py-4 font-semibold">{formatMarketplacePrice(listing.price)}</td><td className="px-4 py-4">{formatMarketplaceMileage(listing.mileage)}</td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">{listing.status}</span></td><td className="px-4 py-4 text-slate-500">{new Date(listing.updated_at).toLocaleDateString("en-GB")}</td><td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => navigateTo(`/admin/vehicles/${listing.id}/edit`)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 font-semibold"><Pencil className="h-4 w-4" />Edit</button>{["published", "reserved", "sold"].includes(listing.status) ? <a href={`/cars/${listing.slug}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 font-semibold"><Eye className="h-4 w-4" />View</a> : null}</div></td></tr>)}</tbody></table>{!filtered.length ? <p className="p-8 text-center text-slate-600">No listings match this view.</p> : null}</div>}
  </section>;
}

export default MarketplaceListingsAdminPage;

