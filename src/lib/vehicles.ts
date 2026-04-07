import { supabase } from "./supabase";

export interface VehicleMakeRecord {
  id: number;
  name: string;
  sort_order: number | null;
  is_popular: boolean;
}

export interface VehicleModelRecord {
  id: number;
  make_id: number;
  name: string;
  sort_order: number | null;
  is_popular: boolean;
}

export interface VehicleModelFuelRecord {
  id: number;
  model_id: number;
  fuel_type: string;
  sort_order: number | null;
}

export interface VehicleModelEngineSizeRecord {
  id: number;
  model_id: number;
  engine_size_simple: number | null;
  engine_size_desc: string;
  sort_order: number | null;
}

export interface VehicleModelYearRecord {
  id: number;
  model_id: number;
  year: number;
  sort_order: number | null;
}

export interface VehicleModelMetadata {
  fuels: VehicleModelFuelRecord[];
  engineSizes: VehicleModelEngineSizeRecord[];
  years: VehicleModelYearRecord[];
}

const normalizeName = (value: string) => value.trim();

export async function fetchVehicleMakes() {
  const { data, error } = await supabase
    .from("vehicle_makes")
    .select("id, name, sort_order, is_popular")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch vehicle makes");
  }

  return (data || [])
    .map((make) => ({
      id: Number(make.id),
      name: normalizeName(make.name),
      sort_order:
        typeof make.sort_order === "number" ? make.sort_order : null,
      is_popular: Boolean(make.is_popular),
    }))
    .filter((make): make is VehicleMakeRecord => Boolean(make.name));
}

export async function fetchVehicleModels(makeId: number) {
  const { data, error } = await supabase
    .from("vehicle_models")
    .select("id, make_id, name, sort_order, is_popular")
    .eq("make_id", makeId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch vehicle models");
  }

  return (data || [])
    .map((model) => ({
      id: Number(model.id),
      make_id: Number(model.make_id),
      name: normalizeName(model.name),
      sort_order:
        typeof model.sort_order === "number" ? model.sort_order : null,
      is_popular: Boolean(model.is_popular),
    }))
    .filter((model): model is VehicleModelRecord => Boolean(model.name));
}

export async function fetchVehicleMetadataForModels(modelIds: number[]) {
  if (!modelIds.length) {
    return {} as Record<number, VehicleModelMetadata>;
  }

  const [fuelsResult, engineSizesResult, yearsResult] = await Promise.all([
    supabase
      .from("vehicle_model_fuels")
      .select("id, model_id, fuel_type, sort_order")
      .in("model_id", modelIds)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("fuel_type", { ascending: true }),
    supabase
      .from("vehicle_model_engine_sizes")
      .select("id, model_id, engine_size_simple, engine_size_desc, sort_order")
      .in("model_id", modelIds)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("engine_size_simple", { ascending: true, nullsFirst: false })
      .order("engine_size_desc", { ascending: true }),
    supabase
      .from("vehicle_model_years")
      .select("id, model_id, year, sort_order")
      .in("model_id", modelIds)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("year", { ascending: false }),
  ]);

  if (fuelsResult.error) {
    throw new Error(fuelsResult.error.message || "Failed to fetch fuel types");
  }

  if (engineSizesResult.error) {
    throw new Error(
      engineSizesResult.error.message || "Failed to fetch engine sizes",
    );
  }

  if (yearsResult.error) {
    throw new Error(yearsResult.error.message || "Failed to fetch years");
  }

  const metadataByModelId = Object.fromEntries(
    modelIds.map((modelId) => [
      modelId,
      {
        fuels: [],
        engineSizes: [],
        years: [],
      },
    ]),
  ) as Record<number, VehicleModelMetadata>;

  (fuelsResult.data || []).forEach((fuel) => {
    metadataByModelId[Number(fuel.model_id)]?.fuels.push({
      id: Number(fuel.id),
      model_id: Number(fuel.model_id),
      fuel_type: normalizeName(fuel.fuel_type),
      sort_order: typeof fuel.sort_order === "number" ? fuel.sort_order : null,
    });
  });

  (engineSizesResult.data || []).forEach((engineSize) => {
    metadataByModelId[Number(engineSize.model_id)]?.engineSizes.push({
      id: Number(engineSize.id),
      model_id: Number(engineSize.model_id),
      engine_size_simple:
        typeof engineSize.engine_size_simple === "number"
          ? engineSize.engine_size_simple
          : null,
      engine_size_desc: normalizeName(engineSize.engine_size_desc),
      sort_order:
        typeof engineSize.sort_order === "number"
          ? engineSize.sort_order
          : null,
    });
  });

  (yearsResult.data || []).forEach((year) => {
    metadataByModelId[Number(year.model_id)]?.years.push({
      id: Number(year.id),
      model_id: Number(year.model_id),
      year: Number(year.year),
      sort_order: typeof year.sort_order === "number" ? year.sort_order : null,
    });
  });

  return metadataByModelId;
}
