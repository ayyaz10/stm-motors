import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, LoaderCircle, Save, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  deleteMarketplaceListingImage,
  fetchAdminMarketplaceListing,
  getMarketplaceListingImageUrl,
  saveMarketplaceListing,
  setMarketplacePrimaryImage,
  slugifyMarketplaceListing,
  updateMarketplaceImageOrder,
  uploadMarketplaceListingImages,
  type MarketplaceAdminVehicleListing,
  type MarketplaceListingInput,
  type MarketplaceListingStatus,
  type MarketplaceVehicleImage,
} from "../../../lib/marketplace";
import { navigateTo } from "../../../lib/navigation";
import { usePageMetadata } from "../../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../../lib/siteMode";

const emptyForm = {
  slug: "", stock_reference: "", make: "", model: "", derivative: "", registration_number: "",
  year: String(new Date().getFullYear()), price: "", mileage: "", fuel_type: "Petrol", transmission: "Manual",
  body_type: "", engine_size: "", colour: "", doors: "5", seats: "5", previous_owners: "",
  service_history: "", mot_expiry: "", description: "", features: "", specifications: "",
  status: "draft" as MarketplaceListingStatus, featured: false, show_when_sold: true, internal_notes: "",
};
type EditorForm = typeof emptyForm;

function toNullableNumber(value: string) { const number = Number(value); return value.trim() && Number.isFinite(number) ? number : null; }
function parseSpecifications(value: string) {
  return Object.fromEntries(value.split("\n").map((line) => line.split(":")).filter(([key, ...rest]) => key?.trim() && rest.join(":").trim()).map(([key, ...rest]) => [key.trim(), rest.join(":").trim()]));
}
function listingToForm(listing: MarketplaceAdminVehicleListing): EditorForm {
  return {
    slug: listing.slug, stock_reference: listing.stock_reference ?? "", make: listing.make, model: listing.model,
    derivative: listing.derivative ?? "", registration_number: listing.registration_number ?? "", year: String(listing.year),
    price: String(listing.price), mileage: String(listing.mileage), fuel_type: listing.fuel_type, transmission: listing.transmission,
    body_type: listing.body_type ?? "", engine_size: listing.engine_size ?? "", colour: listing.colour ?? "",
    doors: listing.doors?.toString() ?? "", seats: listing.seats?.toString() ?? "", previous_owners: listing.previous_owners?.toString() ?? "",
    service_history: listing.service_history ?? "", mot_expiry: listing.mot_expiry ?? "", description: listing.description,
    features: listing.features.join("\n"), specifications: Object.entries(listing.specifications).map(([key, value]) => `${key}: ${value}`).join("\n"),
    status: listing.status, featured: listing.featured, show_when_sold: listing.show_when_sold, internal_notes: listing.internal_notes ?? "",
  };
}

function MarketplaceListingEditorPage({ listingId, userId }: { listingId?: string; userId: string }) {
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [images, setImages] = useState<MarketplaceVehicleImage[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  usePageMetadata({ title: `${listingId ? "Edit" : "Add"} Vehicle | STM Motors`, description: "Manage an STM Motors vehicle listing.", pathname: listingId ? `/admin/vehicles/${listingId}/edit` : "/admin/vehicles/new", canonicalOrigin: MARKETPLACE_SITE_ORIGIN, noIndex: true });
  useEffect(() => { if (!listingId) return; let active = true; fetchAdminMarketplaceListing(listingId).then((listing) => { if (!active) return; if (!listing) { setError("Listing not found."); return; } setForm(listingToForm(listing)); setImages(listing.images); }).catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load listing."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [listingId]);
  const update = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const buildInput = (): MarketplaceListingInput => ({
    slug: slugifyMarketplaceListing(form.slug || `${form.year}-${form.make}-${form.model}-${form.stock_reference}`),
    stock_reference: form.stock_reference.trim() || null, make: form.make.trim(), model: form.model.trim(), derivative: form.derivative.trim() || null,
    registration_number: form.registration_number.replace(/\s+/g, "").toUpperCase() || null,
    year: Number(form.year), price: Number(form.price), mileage: Number(form.mileage), fuel_type: form.fuel_type.trim(), transmission: form.transmission.trim(),
    body_type: form.body_type.trim() || null, engine_size: form.engine_size.trim() || null, colour: form.colour.trim() || null,
    doors: toNullableNumber(form.doors), seats: toNullableNumber(form.seats), previous_owners: toNullableNumber(form.previous_owners),
    service_history: form.service_history.trim() || null, mot_expiry: form.mot_expiry || null, description: form.description.trim(),
    features: form.features.split("\n").map((value) => value.trim()).filter(Boolean), specifications: parseSpecifications(form.specifications),
    status: form.status, featured: form.featured, show_when_sold: form.show_when_sold, internal_notes: form.internal_notes.trim() || null,
  });
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setSuccess("");
      const input = buildInput();
      if (!input.slug || !input.make || !input.model || !input.description || !Number.isInteger(input.year) || input.price < 0 || !Number.isInteger(input.mileage) || input.mileage < 0) throw new Error("Complete the required vehicle, price, mileage and description fields.");
      const id = await saveMarketplaceListing(input, userId, listingId);
      if (pendingImages.length) await uploadMarketplaceListingImages(id, pendingImages, userId, images.length);
      if (!listingId) { navigateTo(`/admin/vehicles/${id}/edit`, true); return; }
      const refreshed = await fetchAdminMarketplaceListing(id); if (refreshed) { setForm(listingToForm(refreshed)); setImages(refreshed.images); }
      setPendingImages([]); setSuccess("Vehicle listing saved successfully.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save listing."); }
    finally { setSaving(false); }
  };
  const removeImage = async (image: MarketplaceVehicleImage) => { if (!window.confirm("Remove this image permanently?")) return; try { await deleteMarketplaceListingImage(image); setImages((current) => current.filter((item) => item.id !== image.id)); } catch (removeError) { setError(removeError instanceof Error ? removeError.message : "Unable to remove image."); } };
  const makePrimary = async (image: MarketplaceVehicleImage) => { if (!listingId) return; try { await setMarketplacePrimaryImage(listingId, image.id); setImages((current) => current.map((item) => ({ ...item, is_primary: item.id === image.id })).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)); } catch (primaryError) { setError(primaryError instanceof Error ? primaryError.message : "Unable to set primary image."); } };
  const moveImage = async (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= images.length) return; const next = [...images]; [next[index], next[target]] = [next[target], next[index]]; setImages(next); try { await updateMarketplaceImageOrder(next); } catch (orderError) { setError(orderError instanceof Error ? orderError.message : "Unable to reorder images."); } };
  const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#1c69d4] focus:ring-4 focus:ring-blue-100";
  if (loading) return <div className="flex min-h-96 items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-[#1c69d4]" /></div>;
  return <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8"><button type="button" onClick={() => navigateTo("/admin/vehicles")} className="inline-flex items-center gap-2 text-sm font-semibold text-[#1c69d4]"><ArrowLeft className="h-4 w-4" />Back to vehicles</button><div className="mt-5"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1c69d4]">Inventory editor</p><h1 className="mt-2 text-3xl font-bold">{listingId ? "Edit vehicle" : "Add a vehicle"}</h1></div>
    <form onSubmit={handleSave} className="mt-7 space-y-7"><fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><legend className="px-2 text-xl font-bold">Listing identity</legend><div className="mt-3 grid gap-5 md:grid-cols-2 lg:grid-cols-3"><label className="text-sm font-semibold">Make *<input required value={form.make} onChange={(e) => update("make", e.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">Model *<input required value={form.model} onChange={(e) => update("model", e.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">Derivative / trim<input value={form.derivative} onChange={(e) => update("derivative", e.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">Stock reference<input value={form.stock_reference} onChange={(e) => update("stock_reference", e.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">Registration (admin only)<input value={form.registration_number} onChange={(e) => update("registration_number", e.target.value.toUpperCase())} className={fieldClass} /></label><label className="text-sm font-semibold">URL slug<input value={form.slug} onChange={(e) => update("slug", e.target.value)} className={fieldClass} placeholder="Auto-generated if blank" /></label></div></fieldset>
      <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><legend className="px-2 text-xl font-bold">Price and specification</legend><div className="mt-3 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{[{ key: "year", label: "Year *", type: "number" }, { key: "price", label: "Price (£) *", type: "number" }, { key: "mileage", label: "Mileage *", type: "number" }, { key: "engine_size", label: "Engine size", type: "text" }, { key: "body_type", label: "Body type", type: "text" }, { key: "colour", label: "Colour", type: "text" }, { key: "doors", label: "Doors", type: "number" }, { key: "seats", label: "Seats", type: "number" }, { key: "previous_owners", label: "Previous owners", type: "number" }].map(({ key, label, type }) => <label key={key} className="text-sm font-semibold">{label}<input required={["year", "price", "mileage"].includes(key)} min={type === "number" ? 0 : undefined} type={type} value={form[key as keyof EditorForm] as string} onChange={(e) => update(key as keyof EditorForm, e.target.value as never)} className={fieldClass} /></label>)}<label className="text-sm font-semibold">Fuel *<select value={form.fuel_type} onChange={(e) => update("fuel_type", e.target.value)} className={fieldClass}>{["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "Other"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-semibold">Transmission *<select value={form.transmission} onChange={(e) => update("transmission", e.target.value)} className={fieldClass}>{["Manual", "Automatic", "Semi-automatic"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-semibold">MOT expiry<input type="date" value={form.mot_expiry} onChange={(e) => update("mot_expiry", e.target.value)} className={fieldClass} /></label></div></fieldset>
      <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><legend className="px-2 text-xl font-bold">Customer-facing content</legend><div className="mt-3 grid gap-5"><label className="text-sm font-semibold">Description *<textarea required rows={7} value={form.description} onChange={(e) => update("description", e.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">Features — one per line<textarea rows={7} value={form.features} onChange={(e) => update("features", e.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">Additional specifications — `Label: Value`, one per line<textarea rows={5} value={form.specifications} onChange={(e) => update("specifications", e.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">Service history<textarea rows={4} value={form.service_history} onChange={(e) => update("service_history", e.target.value)} className={fieldClass} /></label></div></fieldset>
      <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><legend className="px-2 text-xl font-bold">Publishing</legend><div className="mt-3 grid gap-5 md:grid-cols-3"><label className="text-sm font-semibold">Status<select value={form.status} onChange={(e) => update("status", e.target.value as MarketplaceListingStatus)} className={fieldClass}>{["draft", "published", "reserved", "sold", "archived"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="flex items-center gap-3 pt-8 text-sm font-semibold"><input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} className="h-4 w-4" />Featured listing</label><label className="flex items-center gap-3 pt-8 text-sm font-semibold"><input type="checkbox" checked={form.show_when_sold} onChange={(e) => update("show_when_sold", e.target.checked)} className="h-4 w-4" />Keep visible when sold</label><label className="md:col-span-3 text-sm font-semibold">Internal notes (never public)<textarea rows={4} value={form.internal_notes} onChange={(e) => update("internal_notes", e.target.value)} className={fieldClass} /></label></div></fieldset>
      <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><legend className="px-2 text-xl font-bold">Vehicle images</legend><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-6 font-semibold text-[#1c69d4]"><ImagePlus className="h-5 w-5" />Choose JPG, PNG or WebP images<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setPendingImages(Array.from(e.target.files ?? []))} className="hidden" /></label>{pendingImages.length ? <p className="mt-3 text-sm text-slate-600">{pendingImages.length} new image(s) will upload when you save.</p> : null}{images.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200"><img src={getMarketplaceListingImageUrl(image.storage_path)} alt={image.alt_text} className="aspect-[4/3] w-full object-cover" /><div className="flex flex-wrap gap-2 p-3"><button type="button" onClick={() => void makePrimary(image)} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${image.is_primary ? "bg-amber-100 text-amber-800" : "bg-slate-100"}`}><Star className="h-3 w-3" />{image.is_primary ? "Primary" : "Make primary"}</button><button type="button" onClick={() => void moveImage(index, -1)} disabled={index === 0} className="rounded-lg bg-slate-100 p-1.5 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button><button type="button" onClick={() => void moveImage(index, 1)} disabled={index === images.length - 1} className="rounded-lg bg-slate-100 p-1.5 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button><button type="button" onClick={() => void removeImage(image)} className="ml-auto rounded-lg bg-rose-50 p-1.5 text-rose-700"><Trash2 className="h-3 w-3" /></button></div></div>)}</div> : null}</fieldset>
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</p> : null}{success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{success}</p> : null}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigateTo("/admin/vehicles")} className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold">Cancel</button><button disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}{saving ? "Saving…" : "Save listing"}</button></div>
    </form></section>;
}

export default MarketplaceListingEditorPage;

