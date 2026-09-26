import { supabase } from "./supabase";

export type MarketplaceListingStatus =
  | "draft"
  | "published"
  | "reserved"
  | "sold"
  | "archived";
export type MarketplaceEnquiryStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "completed"
  | "closed";

export interface MarketplaceVehicleImage {
  id: string;
  vehicle_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface MarketplaceVehicleListing {
  id: string;
  slug: string;
  stock_reference: string | null;
  make: string;
  model: string;
  derivative: string | null;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string | null;
  engine_size: string | null;
  colour: string | null;
  doors: number | null;
  seats: number | null;
  previous_owners: number | null;
  service_history: string | null;
  mot_expiry: string | null;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  status: MarketplaceListingStatus;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: MarketplaceVehicleImage[];
}

export interface MarketplaceAdminVehicleListing
  extends MarketplaceVehicleListing {
  registration_number: string | null;
  show_when_sold: boolean;
  internal_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface MarketplaceListingFilters {
  search?: string;
  make?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  sort?: "newest" | "price_asc" | "price_desc" | "mileage_asc" | "year_desc";
  page?: number;
  pageSize?: number;
}

export interface MarketplaceVehicleEnquiry {
  id: string;
  reference: string;
  vehicle_id: string;
  vehicle_title_snapshot: string;
  listing_slug_snapshot: string;
  displayed_price_snapshot: number;
  name: string;
  email: string;
  phone: string | null;
  preferred_contact: "email" | "phone" | "either";
  message: string;
  source_url: string | null;
  status: MarketplaceEnquiryStatus;
  internal_notes: string | null;
  contacted_at: string | null;
  created_at: string;
}

export interface MarketplaceSellSubmission {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  postcode: string;
  preferred_contact: "email" | "phone" | "either";
  registration_number: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuel_type: string | null;
  transmission: string | null;
  colour: string | null;
  body_type: string | null;
  service_history: string | null;
  mot_expiry: string | null;
  previous_owners: number | null;
  condition: string;
  known_faults: string | null;
  outstanding_finance: "yes" | "no" | "unsure";
  expected_price: number | null;
  additional_notes: string | null;
  source_url: string | null;
  status: MarketplaceEnquiryStatus;
  internal_notes: string | null;
  contacted_at: string | null;
  created_at: string;
  marketplace_sell_submission_images?: Array<{
    id: string;
    storage_path: string;
    original_filename: string;
    sort_order: number;
  }>;
}

export interface MarketplaceListingInput {
  slug: string;
  stock_reference: string | null;
  make: string;
  model: string;
  derivative: string | null;
  registration_number: string | null;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string | null;
  engine_size: string | null;
  colour: string | null;
  doors: number | null;
  seats: number | null;
  previous_owners: number | null;
  service_history: string | null;
  mot_expiry: string | null;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  status: MarketplaceListingStatus;
  featured: boolean;
  show_when_sold: boolean;
  internal_notes: string | null;
}

const PUBLIC_LISTING_COLUMNS =
  "id, slug, stock_reference, make, model, derivative, year, price, mileage, fuel_type, transmission, body_type, engine_size, colour, doors, seats, previous_owners, service_history, mot_expiry, description, features, specifications, status, featured, published_at, created_at, updated_at";
const ADMIN_LISTING_COLUMNS = `${PUBLIC_LISTING_COLUMNS}, registration_number, show_when_sold, internal_notes, created_by, updated_by`;
const LISTING_IMAGE_COLUMNS =
  "id, vehicle_id, storage_path, alt_text, sort_order, is_primary";

export const MARKETPLACE_LISTING_IMAGE_BUCKET = "marketplace-listings";
export const MARKETPLACE_SELLER_IMAGE_BUCKET = "marketplace-seller-submissions";
export const MAX_MARKETPLACE_IMAGES = 12;
export const MAX_LISTING_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_SELLER_IMAGES = 4;
export const MAX_SELLER_IMAGE_BYTES = 4 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function messageFromError(error: { message?: string } | null, fallback: string) {
  return error?.message || fallback;
}

function normalizePublicListing(
  row: Omit<MarketplaceVehicleListing, "images">,
  images: MarketplaceVehicleImage[],
): MarketplaceVehicleListing {
  return {
    ...row,
    price: Number(row.price),
    mileage: Number(row.mileage),
    features: Array.isArray(row.features) ? row.features : [],
    specifications:
      row.specifications && typeof row.specifications === "object"
        ? row.specifications
        : {},
    images: images
      .filter((image) => image.vehicle_id === row.id)
      .sort(
        (left, right) =>
          Number(right.is_primary) - Number(left.is_primary) ||
          left.sort_order - right.sort_order,
      ),
  };
}

async function loadPublicImages(vehicleIds: string[]) {
  if (!vehicleIds.length) return [];

  const { data, error } = await supabase
    .from("marketplace_public_vehicle_images")
    .select(LISTING_IMAGE_COLUMNS)
    .in("vehicle_id", vehicleIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(messageFromError(error, "Unable to load vehicle images."));
  return (data ?? []) as MarketplaceVehicleImage[];
}

export function getMarketplaceListingImageUrl(path: string): string {
  if (!path) return "/images/cars/vehicle-placeholder.svg";
  return supabase.storage.from(MARKETPLACE_LISTING_IMAGE_BUCKET).getPublicUrl(path)
    .data.publicUrl;
}

export function formatMarketplacePrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMarketplaceMileage(mileage: number): string {
  return `${new Intl.NumberFormat("en-GB").format(mileage)} miles`;
}

export function slugifyMarketplaceListing(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function validateMarketplaceImage(file: File, maxBytes: number): string | null {
  if (!acceptedImageTypes.has(file.type)) return "Use JPG, PNG or WebP images only.";
  if (file.size <= 0 || file.size > maxBytes) {
    return `Each image must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB.`;
  }
  return null;
}

export async function fetchMarketplaceListings(filters: MarketplaceListingFilters = {}) {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 12, 1), 48);
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("marketplace_public_vehicle_listings")
    .select(PUBLIC_LISTING_COLUMNS, { count: "exact" });

  const safeSearch = (filters.search ?? "")
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .trim();
  if (safeSearch) {
    query = query.or(
      `make.ilike.%${safeSearch}%,model.ilike.%${safeSearch}%,derivative.ilike.%${safeSearch}%`,
    );
  }
  if (filters.make) query = query.eq("make", filters.make);
  if (filters.fuelType) query = query.eq("fuel_type", filters.fuelType);
  if (filters.transmission) query = query.eq("transmission", filters.transmission);
  if (filters.bodyType) query = query.eq("body_type", filters.bodyType);
  if (typeof filters.minPrice === "number") query = query.gte("price", filters.minPrice);
  if (typeof filters.maxPrice === "number") query = query.lte("price", filters.maxPrice);
  if (typeof filters.minYear === "number") query = query.gte("year", filters.minYear);
  if (typeof filters.maxYear === "number") query = query.lte("year", filters.maxYear);

  switch (filters.sort) {
    case "price_asc": query = query.order("price", { ascending: true }); break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    case "mileage_asc": query = query.order("mileage", { ascending: true }); break;
    case "year_desc": query = query.order("year", { ascending: false }); break;
    default:
      query = query.order("featured", { ascending: false }).order("published_at", {
        ascending: false,
        nullsFirst: false,
      });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(messageFromError(error, "Unable to load available cars."));
  const rows = (data ?? []) as Array<Omit<MarketplaceVehicleListing, "images">>;
  const images = await loadPublicImages(rows.map((row) => row.id));

  return {
    listings: rows.map((row) => normalizePublicListing(row, images)),
    count: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchMarketplaceFilterOptions() {
  const { data, error } = await supabase
    .from("marketplace_public_vehicle_listings")
    .select("make, fuel_type, transmission, body_type");
  if (error) throw new Error(messageFromError(error, "Unable to load vehicle filters."));
  const rows = data ?? [];
  const unique = (values: Array<string | null>) =>
    [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
  return {
    makes: unique(rows.map((row) => row.make)),
    fuelTypes: unique(rows.map((row) => row.fuel_type)),
    transmissions: unique(rows.map((row) => row.transmission)),
    bodyTypes: unique(rows.map((row) => row.body_type)),
  };
}

export async function fetchMarketplaceVehicleBySlug(slug: string) {
  const { data, error } = await supabase
    .from("marketplace_public_vehicle_listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(messageFromError(error, "Unable to load this vehicle."));
  if (!data) return null;
  const images = await loadPublicImages([data.id]);
  return normalizePublicListing(
    data as Omit<MarketplaceVehicleListing, "images">,
    images,
  );
}

export async function fetchAdminMarketplaceListings() {
  const { data, error } = await supabase
    .from("marketplace_vehicle_listings")
    .select(ADMIN_LISTING_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(messageFromError(error, "Unable to load vehicle listings."));
  const rows = (data ?? []) as Array<Omit<MarketplaceAdminVehicleListing, "images">>;
  const { data: imageRows, error: imageError } = rows.length
    ? await supabase
        .from("marketplace_vehicle_images")
        .select(LISTING_IMAGE_COLUMNS)
        .in("vehicle_id", rows.map((row) => row.id))
    : { data: [], error: null };
  if (imageError) throw new Error(messageFromError(imageError, "Unable to load listing images."));
  return rows.map((row) =>
    normalizePublicListing(row, (imageRows ?? []) as MarketplaceVehicleImage[]) as MarketplaceAdminVehicleListing,
  );
}

export async function fetchAdminMarketplaceListing(id: string) {
  const { data, error } = await supabase
    .from("marketplace_vehicle_listings")
    .select(ADMIN_LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(messageFromError(error, "Unable to load the listing."));
  if (!data) return null;
  const { data: images, error: imageError } = await supabase
    .from("marketplace_vehicle_images")
    .select(LISTING_IMAGE_COLUMNS)
    .eq("vehicle_id", id)
    .order("is_primary", { ascending: false })
    .order("sort_order");
  if (imageError) throw new Error(messageFromError(imageError, "Unable to load listing images."));
  return normalizePublicListing(
    data as Omit<MarketplaceAdminVehicleListing, "images">,
    (images ?? []) as MarketplaceVehicleImage[],
  ) as MarketplaceAdminVehicleListing;
}

export async function deleteMarketplaceListing(
  listing: MarketplaceAdminVehicleListing,
): Promise<void> {
  if (listing.status !== "draft" && listing.status !== "archived") {
    throw new Error(
      "Archive this listing before permanently deleting it.",
    );
  }

  const { data: enquiries, error: enquiryError } = await supabase
    .from("marketplace_vehicle_enquiries")
    .select("id")
    .eq("vehicle_id", listing.id)
    .limit(1);

  if (enquiryError) {
    throw new Error(
      messageFromError(enquiryError, "Unable to check listing enquiries."),
    );
  }

  if ((enquiries ?? []).length > 0) {
    throw new Error(
      "This listing has customer enquiries and must be retained as a business record. Keep it archived instead.",
    );
  }

  const { error, count } = await supabase
    .from("marketplace_vehicle_listings")
    .delete({ count: "exact" })
    .eq("id", listing.id)
    .in("status", ["draft", "archived"]);

  if (error) {
    throw new Error(messageFromError(error, "Unable to delete the listing."));
  }

  if (!count) {
    throw new Error(
      "This listing could not be deleted. Refresh the page and confirm that it is still draft or archived.",
    );
  }

  const storagePaths = listing.images.map((image) => image.storage_path);
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(MARKETPLACE_LISTING_IMAGE_BUCKET)
      .remove(storagePaths);

    if (storageError) {
      console.error(
        "Listing deleted, but its stored images could not be cleaned up.",
        storageError,
      );
    }
  }
}

export async function saveMarketplaceListing(
  input: MarketplaceListingInput,
  userId: string,
  listingId?: string,
) {
  const payload = {
    ...input,
    published_at:
      input.status === "published" || input.status === "reserved" || input.status === "sold"
        ? new Date().toISOString()
        : null,
    updated_by: userId,
    ...(listingId ? {} : { created_by: userId }),
  };
  const query = listingId
    ? supabase.from("marketplace_vehicle_listings").update(payload).eq("id", listingId)
    : supabase.from("marketplace_vehicle_listings").insert(payload);
  const { data, error } = await query.select("id").single();
  if (error) throw new Error(messageFromError(error, "Unable to save the vehicle listing."));
  return data.id as string;
}

export async function uploadMarketplaceListingImages(
  listingId: string,
  files: File[],
  userId: string,
  existingCount: number,
) {
  if (existingCount + files.length > MAX_MARKETPLACE_IMAGES) {
    throw new Error(`A listing can have up to ${MAX_MARKETPLACE_IMAGES} images.`);
  }
  for (const file of files) {
    const validationError = validateMarketplaceImage(file, MAX_LISTING_IMAGE_BYTES);
    if (validationError) throw new Error(validationError);
  }
  const uploadedPaths: string[] = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${listingId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(MARKETPLACE_LISTING_IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      const { error: rowError } = await supabase.from("marketplace_vehicle_images").insert({
        vehicle_id: listingId,
        storage_path: path,
        alt_text: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        sort_order: existingCount + index,
        is_primary: existingCount === 0 && index === 0,
        created_by: userId,
      });
      if (rowError) throw rowError;
    }
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(MARKETPLACE_LISTING_IMAGE_BUCKET).remove(uploadedPaths);
    }
    throw new Error(error instanceof Error ? error.message : "Unable to upload listing images.");
  }
}

export async function deleteMarketplaceListingImage(image: MarketplaceVehicleImage) {
  const { error: storageError } = await supabase.storage
    .from(MARKETPLACE_LISTING_IMAGE_BUCKET)
    .remove([image.storage_path]);
  if (storageError) throw new Error(storageError.message);
  const { error } = await supabase.from("marketplace_vehicle_images").delete().eq("id", image.id);
  if (error) throw new Error(error.message);
}

export async function setMarketplacePrimaryImage(vehicleId: string, imageId: string) {
  const { error: clearError } = await supabase
    .from("marketplace_vehicle_images")
    .update({ is_primary: false })
    .eq("vehicle_id", vehicleId);
  if (clearError) throw new Error(clearError.message);
  const { error } = await supabase
    .from("marketplace_vehicle_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("vehicle_id", vehicleId);
  if (error) throw new Error(error.message);
}

export async function updateMarketplaceImageOrder(images: MarketplaceVehicleImage[]) {
  for (let index = 0; index < images.length; index += 1) {
    const { error } = await supabase
      .from("marketplace_vehicle_images")
      .update({ sort_order: index })
      .eq("id", images[index].id);
    if (error) throw new Error(error.message);
  }
}

export async function submitMarketplaceVehicleEnquiry(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("submit-marketplace-enquiry", {
    body: payload,
  });
  if (error) throw new Error((data as { error?: string } | null)?.error || error.message);
  const response = data as { success?: boolean; error?: string; reference?: string };
  if (!response.success) throw new Error(response.error || "Unable to send your enquiry.");
  return response.reference ?? "";
}

export async function submitMarketplaceSellRequest(formData: FormData) {
  const { data, error } = await supabase.functions.invoke("submit-sell-vehicle", {
    body: formData,
  });
  if (error) throw new Error((data as { error?: string } | null)?.error || error.message);
  const response = data as { success?: boolean; error?: string; reference?: string };
  if (!response.success) throw new Error(response.error || "Unable to submit your vehicle.");
  return response.reference ?? "";
}

export async function fetchMarketplaceEnquiries() {
  const { data, error } = await supabase
    .from("marketplace_vehicle_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MarketplaceVehicleEnquiry[];
}

export async function fetchMarketplaceSellSubmissions() {
  const { data, error } = await supabase
    .from("marketplace_sell_submissions")
    .select("*, marketplace_sell_submission_images(id, storage_path, original_filename, sort_order)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MarketplaceSellSubmission[];
}

export async function updateMarketplaceEnquiry(
  table: "marketplace_vehicle_enquiries" | "marketplace_sell_submissions",
  id: string,
  status: MarketplaceEnquiryStatus,
  internalNotes: string,
) {
  const { error } = await supabase
    .from(table)
    .update({
      status,
      internal_notes: internalNotes.trim() || null,
      contacted_at: status === "contacted" ? new Date().toISOString() : undefined,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createSellerImageSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(MARKETPLACE_SELLER_IMAGE_BUCKET)
    .createSignedUrl(path, 600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
