import { services } from "../data/services";
import type { BookingLocationAddress } from "./bookingLocation";
import {
  deriveJobProgressStatus,
  type DerivedJobProgressStatus,
} from "./jobProgress";
import { supabase } from "./supabase";
import {
  createVehicleCheckInPhotoUrls,
  type VehicleCheckInPhotoUrls,
} from "./vehicleCheckIns";
import {
  createJob,
  deleteJob,
  type CreateJobPayload,
  type CreatedJob,
} from "./jobs";

export type { DerivedJobProgressStatus } from "./jobProgress";

interface ServiceCatalogEntry {
  id: string;
  name: string;
  shortDescription: string;
  labourTime: string;
  partsIncluded: string[];
  importantNotes: string[];
  workDetails: string[];
}

interface InsertedJobServiceRow {
  id: string;
  job_id: string;
  service_id: string;
  service_name: string;
  short_description: string | null;
  labour_time: string | null;
  parts_included: string[] | null;
  important_notes: string[] | null;
  sort_order: number;
}

interface InsertedChecklistItemRow {
  id: string;
  job_service_id: string;
  checklist_label: string;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
  completed_by_name: string | null;
  notes: string | null;
}

export interface JobChecklistItem {
  id: string;
  job_service_id: string;
  checklist_label: string;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
  completed_by_name: string | null;
  notes: string | null;
}

export interface JobServiceSnapshot {
  id: string;
  job_id: string;
  service_id: string;
  service_name: string;
  short_description: string | null;
  labour_time: string | null;
  parts_included: string[];
  important_notes: string[];
  sort_order: number;
  checklist_items: JobChecklistItem[];
}

export interface JobWorkflowBooking {
  id: string;
  booking_number: string;
  full_name: string;
  phone: string;
  email: string;
  street_address_1: string;
  street_address_2: string | null;
  city: string;
  postcode: string;
  car_registration: string;
  make: string | null;
  model: string | null;
  fuel: string | null;
  engine: string | null;
  year: string | null;
  latitude: number | null;
  longitude: number | null;
  selected_services: string[];
  total_price: number;
  created_at: string;
}

export interface JobWorkflowOverview {
  job: CreatedJob;
  booking: JobWorkflowBooking;
  services: JobServiceSnapshot[];
  progressStatus: DerivedJobProgressStatus;
  checklistTotals: {
    total: number;
    completed: number;
  };
  location: BookingLocationAddress;
  checkIn: {
    id: string | null;
    isSubmitted: boolean;
    submittedAt: string | null;
    submittedBy: string | null;
    notes: string | null;
    visibleDamage: boolean | null;
    warningLights: boolean | null;
    photoPaths: {
      odometer: string | null;
      front: string | null;
      rear: string | null;
      left: string | null;
      right: string | null;
    };
    photos: VehicleCheckInPhotoUrls;
  };
}

export interface OpsJobProgressBoardItem {
  job: CreatedJob;
  booking: Pick<
    JobWorkflowBooking,
    | "id"
    | "booking_number"
    | "full_name"
    | "phone"
    | "car_registration"
    | "city"
    | "postcode"
  >;
  services: Array<{
    id: string;
    service_name: string;
  }>;
  checklistTotals: {
    total: number;
    completed: number;
  };
  checkIn: {
    isSubmitted: boolean;
    submittedAt: string | null;
    submittedBy: string | null;
    photoCount: number;
  };
  progressStatus: DerivedJobProgressStatus;
}

const serviceCatalog = new Map<string, ServiceCatalogEntry>(
  services.map((service) => [
    service.id,
    {
      id: service.id,
      name: service.name,
      shortDescription: service.shortDescription,
      labourTime: service.labourTime,
      partsIncluded: [...service.partsIncluded],
      importantNotes: [...service.importantNotes],
      workDetails: [...service.workDetails],
    },
  ]),
);

function buildFallbackService(serviceId: string): ServiceCatalogEntry {
  return {
    id: serviceId,
    name: serviceId,
    shortDescription: "Requested service",
    labourTime: "To be confirmed",
    partsIncluded: [],
    importantNotes: [],
    workDetails: ["Complete requested service work"],
  };
}

function getServiceCatalogEntry(serviceId: string): ServiceCatalogEntry {
  return serviceCatalog.get(serviceId) ?? buildFallbackService(serviceId);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function createJobWithServiceSnapshots(
  payload: CreateJobPayload,
  selectedServiceIds: string[],
): Promise<CreatedJob> {
  const job = await createJob(payload);

  try {
    const jobServicePayload = selectedServiceIds.map((serviceId, index) => {
      const service = getServiceCatalogEntry(serviceId);

      return {
        job_id: job.id,
        service_id: service.id,
        service_name: service.name,
        short_description: service.shortDescription,
        labour_time: service.labourTime,
        parts_included: service.partsIncluded,
        important_notes: service.importantNotes,
        sort_order: index,
      };
    });

    if (jobServicePayload.length === 0) {
      return job;
    }

    const { data: insertedServices, error: servicesError } = await supabase
      .from("job_services")
      .insert(jobServicePayload)
      .select();

    if (servicesError) {
      throw new Error(servicesError.message || "Failed to save job services.");
    }

    const serviceRows = (insertedServices ?? []) as InsertedJobServiceRow[];

    const checklistPayload = serviceRows.flatMap((serviceRow) => {
      const service = getServiceCatalogEntry(serviceRow.service_id);
      const checklistItems =
        service.workDetails.length > 0
          ? service.workDetails
          : ["Complete requested service work"];

      return checklistItems.map((itemLabel, itemIndex) => ({
        job_service_id: serviceRow.id,
        checklist_label: itemLabel,
        sort_order: itemIndex,
      }));
    });

    if (checklistPayload.length > 0) {
      const { error: checklistError } = await supabase
        .from("job_service_checklist_items")
        .insert(checklistPayload);

      if (checklistError) {
        throw new Error(
          checklistError.message || "Failed to save service checklist items.",
        );
      }
    }

    return job;
  } catch (error) {
    try {
      await deleteJob(job.id);
    } catch (cleanupError) {
      console.error("Failed to clean up incomplete job workflow", cleanupError);
    }

    throw error;
  }
}

async function fetchJobByReference(reference: string): Promise<CreatedJob> {
  const baseQuery = supabase
    .from("jobs")
    .select(
      "id, booking_id, job_reference, status, assigned_mechanic_user_id, assigned_mechanic_name, assigned_mechanic_phone, scheduled_for, ops_notes, created_at, updated_at",
    );

  if (isUuid(reference)) {
    const { data, error } = await baseQuery.eq("id", reference).maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to load job details.");
    }

    if (data) {
      return data as CreatedJob;
    }
  }

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, booking_id, job_reference, status, assigned_mechanic_user_id, assigned_mechanic_name, assigned_mechanic_phone, scheduled_for, ops_notes, created_at, updated_at",
    )
    .eq("job_reference", reference)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load job details.");
  }

  if (!data) {
    throw new Error("Job not found.");
  }

  return data as CreatedJob;
}

export async function fetchJobWorkflowOverview(
  reference: string,
): Promise<JobWorkflowOverview> {
  const job = await fetchJobByReference(reference);

  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, full_name, phone, email, street_address_1, street_address_2, city, postcode, car_registration, make, model, fuel, engine, year, latitude, longitude, selected_services, total_price, created_at",
    )
    .eq("id", job.booking_id)
    .single();

  if (bookingError) {
    throw new Error(bookingError.message || "Failed to load booking details.");
  }

  const { data: checkInData, error: checkInError } = await supabase
    .from("vehicle_check_ins")
    .select(
      "id, mechanic_name, visible_damage, warning_lights, notes, odometer_photo_path, front_photo_path, rear_photo_path, left_photo_path, right_photo_path, submitted_at",
    )
    .eq("job_id", job.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkInError) {
    throw new Error(checkInError.message || "Failed to load check-in details.");
  }

  const checkInPhotos = checkInData
    ? await createVehicleCheckInPhotoUrls({
        odometer_photo_path: checkInData.odometer_photo_path,
        front_photo_path: checkInData.front_photo_path,
        rear_photo_path: checkInData.rear_photo_path,
        left_photo_path: checkInData.left_photo_path,
        right_photo_path: checkInData.right_photo_path,
      })
    : {
        odometer: null,
        front: null,
        rear: null,
        left: null,
        right: null,
      };

  const { data: serviceRows, error: servicesError } = await supabase
    .from("job_services")
    .select(
      "id, job_id, service_id, service_name, short_description, labour_time, parts_included, important_notes, sort_order",
    )
    .eq("job_id", job.id)
    .order("sort_order", { ascending: true });

  if (servicesError) {
    throw new Error(servicesError.message || "Failed to load job services.");
  }

  const servicesData = (serviceRows ?? []) as InsertedJobServiceRow[];
  const serviceIds = servicesData.map((service) => service.id);

  let checklistRows: InsertedChecklistItemRow[] = [];

  if (serviceIds.length > 0) {
    const { data: checklistData, error: checklistError } = await supabase
      .from("job_service_checklist_items")
      .select(
        "id, job_service_id, checklist_label, sort_order, is_completed, completed_at, completed_by_name, notes",
      )
      .in("job_service_id", serviceIds)
      .order("sort_order", { ascending: true });

    if (checklistError) {
      throw new Error(
        checklistError.message || "Failed to load job checklist items.",
      );
    }

    checklistRows = (checklistData ?? []) as InsertedChecklistItemRow[];
  }

  const checklistByServiceId = new Map<string, JobChecklistItem[]>();

  checklistRows.forEach((item) => {
    const currentItems = checklistByServiceId.get(item.job_service_id) ?? [];

    currentItems.push({
      id: item.id,
      job_service_id: item.job_service_id,
      checklist_label: item.checklist_label,
      sort_order: item.sort_order,
      is_completed: item.is_completed,
      completed_at: item.completed_at,
      completed_by_name: item.completed_by_name,
      notes: item.notes,
    });
    checklistByServiceId.set(item.job_service_id, currentItems);
  });

  const mappedServices: JobServiceSnapshot[] = servicesData.map((service) => ({
    id: service.id,
    job_id: service.job_id,
    service_id: service.service_id,
    service_name: service.service_name,
    short_description: service.short_description,
    labour_time: service.labour_time,
    parts_included: service.parts_included ?? [],
    important_notes: service.important_notes ?? [],
    sort_order: service.sort_order,
    checklist_items: checklistByServiceId.get(service.id) ?? [],
  }));

  const totalChecklistItems = mappedServices.reduce(
    (total, service) => total + service.checklist_items.length,
    0,
  );
  const completedChecklistItems = mappedServices.reduce(
    (total, service) =>
      total +
      service.checklist_items.filter((item) => item.is_completed).length,
    0,
  );
  const progressStatus = deriveJobProgressStatus(
    job.status,
    Boolean(checkInData),
    completedChecklistItems,
    totalChecklistItems,
  );

  return {
    job,
    booking: {
      id: bookingData.id,
      booking_number: bookingData.booking_number,
      full_name: bookingData.full_name,
      phone: bookingData.phone,
      email: bookingData.email,
      street_address_1: bookingData.street_address_1,
      street_address_2: bookingData.street_address_2,
      city: bookingData.city,
      postcode: bookingData.postcode,
      car_registration: bookingData.car_registration,
      make: bookingData.make,
      model: bookingData.model,
      fuel: bookingData.fuel,
      engine: bookingData.engine,
      year: bookingData.year,
      latitude:
        typeof bookingData.latitude === "number"
          ? bookingData.latitude
          : Number(bookingData.latitude) || null,
      longitude:
        typeof bookingData.longitude === "number"
          ? bookingData.longitude
          : Number(bookingData.longitude) || null,
      selected_services: bookingData.selected_services,
      total_price: Number(bookingData.total_price),
      created_at: bookingData.created_at,
    },
    services: mappedServices,
    progressStatus,
    checklistTotals: {
      total: totalChecklistItems,
      completed: completedChecklistItems,
    },
    location: {
      street_address_1: bookingData.street_address_1,
      street_address_2: bookingData.street_address_2,
      city: bookingData.city,
      postcode: bookingData.postcode,
      latitude:
        typeof bookingData.latitude === "number"
          ? bookingData.latitude
          : Number(bookingData.latitude) || null,
      longitude:
        typeof bookingData.longitude === "number"
          ? bookingData.longitude
          : Number(bookingData.longitude) || null,
    },
    checkIn: {
      id: checkInData?.id ?? null,
      isSubmitted: Boolean(checkInData),
      submittedAt: checkInData?.submitted_at ?? null,
      submittedBy: checkInData?.mechanic_name ?? null,
      notes: checkInData?.notes ?? null,
      visibleDamage: checkInData?.visible_damage ?? null,
      warningLights: checkInData?.warning_lights ?? null,
      photoPaths: {
        odometer: checkInData?.odometer_photo_path ?? null,
        front: checkInData?.front_photo_path ?? null,
        rear: checkInData?.rear_photo_path ?? null,
        left: checkInData?.left_photo_path ?? null,
        right: checkInData?.right_photo_path ?? null,
      },
      photos: checkInPhotos,
    },
  };
}

export async function fetchOpsJobProgressBoard(): Promise<
  OpsJobProgressBoardItem[]
> {
  const { data: jobsData, error: jobsError } = await supabase
    .from("jobs")
    .select(
      "id, booking_id, job_reference, status, assigned_mechanic_user_id, assigned_mechanic_name, assigned_mechanic_phone, scheduled_for, ops_notes, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (jobsError) {
    throw new Error(jobsError.message || "Failed to load jobs.");
  }

  const jobs = (jobsData ?? []) as CreatedJob[];

  if (jobs.length === 0) {
    return [];
  }

  const bookingIds = jobs.map((job) => job.booking_id);
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, full_name, phone, car_registration, city, postcode",
    )
    .in("id", bookingIds);

  if (bookingsError) {
    throw new Error(bookingsError.message || "Failed to load booking details.");
  }

  const bookingsById = new Map(
    (bookingsData ?? []).map((booking) => [booking.id, booking]),
  );

  const jobIds = jobs.map((job) => job.id);
  const { data: checkInsData, error: checkInsError } = await supabase
    .from("vehicle_check_ins")
    .select(
      "job_id, submitted_at, mechanic_name, odometer_photo_path, front_photo_path, rear_photo_path, left_photo_path, right_photo_path",
    )
    .in("job_id", jobIds)
    .order("submitted_at", { ascending: false });

  if (checkInsError) {
    throw new Error(checkInsError.message || "Failed to load check-in progress.");
  }

  const latestCheckInByJobId = new Map<
    string,
    {
      submitted_at: string;
      mechanic_name: string | null;
      photo_count: number;
    }
  >();

  (checkInsData ?? []).forEach((checkIn) => {
    if (!latestCheckInByJobId.has(checkIn.job_id)) {
      const photoPaths = [
        checkIn.odometer_photo_path,
        checkIn.front_photo_path,
        checkIn.rear_photo_path,
        checkIn.left_photo_path,
        checkIn.right_photo_path,
      ];

      latestCheckInByJobId.set(checkIn.job_id, {
        submitted_at: checkIn.submitted_at,
        mechanic_name: checkIn.mechanic_name,
        photo_count: photoPaths.filter(Boolean).length,
      });
    }
  });

  const { data: jobServicesData, error: jobServicesError } = await supabase
    .from("job_services")
    .select("id, job_id, service_name, sort_order")
    .in("job_id", jobIds)
    .order("sort_order", { ascending: true });

  if (jobServicesError) {
    throw new Error(jobServicesError.message || "Failed to load job services.");
  }

  const jobServices = (jobServicesData ?? []) as Array<{
    id: string;
    job_id: string;
    service_name: string;
    sort_order: number;
  }>;
  const servicesByJobId = new Map<string, Array<{ id: string; service_name: string }>>();

  jobServices.forEach((service) => {
    const currentServices = servicesByJobId.get(service.job_id) ?? [];

    currentServices.push({
      id: service.id,
      service_name: service.service_name,
    });
    servicesByJobId.set(service.job_id, currentServices);
  });

  const jobServiceIds = jobServices.map((service) => service.id);
  const checklistTotalsByJobId = new Map<
    string,
    { total: number; completed: number }
  >();

  if (jobServiceIds.length > 0) {
    const { data: checklistData, error: checklistError } = await supabase
      .from("job_service_checklist_items")
      .select("job_service_id, is_completed")
      .in("job_service_id", jobServiceIds);

    if (checklistError) {
      throw new Error(
        checklistError.message || "Failed to load checklist progress.",
      );
    }

    const jobIdByServiceId = new Map(jobServices.map((service) => [service.id, service.job_id]));

    (checklistData ?? []).forEach((item) => {
      const owningJobId = jobIdByServiceId.get(item.job_service_id);

      if (!owningJobId) {
        return;
      }

      const currentTotals = checklistTotalsByJobId.get(owningJobId) ?? {
        total: 0,
        completed: 0,
      };

      currentTotals.total += 1;

      if (item.is_completed) {
        currentTotals.completed += 1;
      }

      checklistTotalsByJobId.set(owningJobId, currentTotals);
    });
  }

  return jobs
    .map((job) => {
      const booking = bookingsById.get(job.booking_id);

      if (!booking) {
        return null;
      }

      const servicesForJob = servicesByJobId.get(job.id) ?? [];
      const checklistTotals = checklistTotalsByJobId.get(job.id) ?? {
        total: 0,
        completed: 0,
      };
      const checkIn = latestCheckInByJobId.get(job.id);

      return {
        job,
        booking: {
          id: booking.id,
          booking_number: booking.booking_number,
          full_name: booking.full_name,
          phone: booking.phone,
          car_registration: booking.car_registration,
          city: booking.city,
          postcode: booking.postcode,
        },
        services: servicesForJob,
        checklistTotals,
        checkIn: {
          isSubmitted: Boolean(checkIn),
          submittedAt: checkIn?.submitted_at ?? null,
          submittedBy: checkIn?.mechanic_name ?? null,
          photoCount: checkIn?.photo_count ?? 0,
        },
        progressStatus: deriveJobProgressStatus(
          job.status,
          Boolean(checkIn),
          checklistTotals.completed,
          checklistTotals.total,
        ),
      } satisfies OpsJobProgressBoardItem;
    })
    .filter((item): item is OpsJobProgressBoardItem => item !== null);
}

export async function updateJobChecklistItem(
  itemId: string,
  updates: {
    is_completed: boolean;
    completed_by_name?: string | null;
    notes?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("job_service_checklist_items")
    .update({
      is_completed: updates.is_completed,
      completed_at: updates.is_completed ? new Date().toISOString() : null,
      completed_by_name: updates.is_completed
        ? updates.completed_by_name ?? null
        : null,
      notes: updates.notes ?? null,
    })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message || "Failed to update checklist item.");
  }
}
