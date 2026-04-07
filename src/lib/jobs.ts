import { supabase } from "./supabase";

export type JobStatus =
  | "unassigned"
  | "assigned"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface CreateJobPayload {
  booking_id: string;
  status?: JobStatus;
  assigned_mechanic_user_id?: string | null;
  assigned_mechanic_name?: string | null;
  assigned_mechanic_phone?: string | null;
  scheduled_for?: string | null;
  ops_notes?: string | null;
}

export interface UpdateJobPayload {
  status?: JobStatus;
  assigned_mechanic_user_id?: string | null;
  assigned_mechanic_name?: string | null;
  assigned_mechanic_phone?: string | null;
  scheduled_for?: string | null;
  ops_notes?: string | null;
}

export interface ReopenJobPayload {
  reason: string;
  reset_workflow?: boolean;
}

export interface CreatedJob {
  id: string;
  booking_id: string;
  job_reference: string;
  status: JobStatus;
  assigned_mechanic_user_id: string | null;
  assigned_mechanic_name: string | null;
  assigned_mechanic_phone: string | null;
  scheduled_for: string | null;
  ops_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentCandidateJob extends CreatedJob {
  has_check_in: boolean;
  total_checklist_items: number;
  completed_checklist_items: number;
  can_unassign: boolean;
}

export interface BookingAssignmentCandidate {
  id: string;
  booking_number: string;
  full_name: string;
  phone: string;
  email: string;
  car_registration: string;
  created_at: string;
  total_price: number;
  selected_services: string[];
  existing_job: AssignmentCandidateJob | null;
}

export async function createJob(
  payload: CreateJobPayload,
): Promise<CreatedJob> {
  const { data, error } = await supabase
    .from("jobs")
    .insert([
      {
        booking_id: payload.booking_id,
        status: payload.status ?? "assigned",
        assigned_mechanic_user_id: payload.assigned_mechanic_user_id ?? null,
        assigned_mechanic_name: payload.assigned_mechanic_name ?? null,
        assigned_mechanic_phone: payload.assigned_mechanic_phone ?? null,
        scheduled_for: payload.scheduled_for ?? null,
        ops_notes: payload.ops_notes ?? null,
      },
    ])
    .select()
    .single<CreatedJob>();

  if (error) {
    throw new Error(error.message || "Failed to create job.");
  }

  return data;
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);

  if (error) {
    throw new Error(error.message || "Failed to remove incomplete job.");
  }
}

export async function updateJob(
  jobId: string,
  payload: UpdateJobPayload,
): Promise<CreatedJob> {
  const updatePayload: Record<string, string | null> = {};

  updatePayload.updated_at = new Date().toISOString();

  if (payload.status !== undefined) {
    updatePayload.status = payload.status;
  }

  if (payload.assigned_mechanic_user_id !== undefined) {
    updatePayload.assigned_mechanic_user_id =
      payload.assigned_mechanic_user_id;
  }

  if (payload.assigned_mechanic_name !== undefined) {
    updatePayload.assigned_mechanic_name = payload.assigned_mechanic_name;
  }

  if (payload.assigned_mechanic_phone !== undefined) {
    updatePayload.assigned_mechanic_phone = payload.assigned_mechanic_phone;
  }

  if (payload.scheduled_for !== undefined) {
    updatePayload.scheduled_for = payload.scheduled_for;
  }

  if (payload.ops_notes !== undefined) {
    updatePayload.ops_notes = payload.ops_notes;
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(updatePayload)
    .eq("id", jobId)
    .select()
    .single<CreatedJob>();

  if (error) {
    throw new Error(error.message || "Failed to update job.");
  }

  return data;
}

export async function reopenJobForOps(
  jobId: string,
  payload: ReopenJobPayload,
): Promise<CreatedJob> {
  const { data, error } = await supabase.rpc("reopen_job_for_ops", {
    p_job_id: jobId,
    p_reason: payload.reason,
    p_reset_workflow: payload.reset_workflow ?? false,
  });

  if (error) {
    throw new Error(error.message || "Failed to reopen the job.");
  }

  const reopenedJob = Array.isArray(data) ? data[0] : data;

  if (!reopenedJob) {
    throw new Error("The reopened job could not be returned.");
  }

  return reopenedJob as CreatedJob;
}

export async function completeAssignedJob(jobId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_assigned_job", {
    p_job_id: jobId,
  });

  if (error) {
    throw new Error(error.message || "Failed to complete the assigned job.");
  }
}

export async function unassignJob(jobId: string): Promise<void> {
  const { data: checkInData, error: checkInError } = await supabase
    .from("vehicle_check_ins")
    .select("id")
    .eq("job_id", jobId)
    .limit(1);

  if (checkInError) {
    throw new Error(checkInError.message || "Failed to check job progress.");
  }

  if ((checkInData ?? []).length > 0) {
    throw new Error(
      "This job cannot be unassigned because vehicle check-in has already been submitted.",
    );
  }

  const { data: jobServicesData, error: jobServicesError } = await supabase
    .from("job_services")
    .select("id")
    .eq("job_id", jobId);

  if (jobServicesError) {
    throw new Error(jobServicesError.message || "Failed to inspect job services.");
  }

  const jobServiceIds = (jobServicesData ?? []).map((service) => service.id);

  if (jobServiceIds.length > 0) {
    const { data: checklistData, error: checklistError } = await supabase
      .from("job_service_checklist_items")
      .select("id")
      .in("job_service_id", jobServiceIds)
      .eq("is_completed", true)
      .limit(1);

    if (checklistError) {
      throw new Error(
        checklistError.message || "Failed to inspect checklist progress.",
      );
    }

    if ((checklistData ?? []).length > 0) {
      throw new Error(
        "This job cannot be unassigned because service work has already started.",
      );
    }
  }

  await deleteJob(jobId);
}

export async function fetchBookingAssignmentCandidates(): Promise<
  BookingAssignmentCandidate[]
> {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, full_name, phone, email, car_registration, created_at, total_price, selected_services",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (bookingsError) {
    throw new Error(bookingsError.message || "Failed to load bookings.");
  }

  if (!bookings || bookings.length === 0) {
    return [];
  }

  const bookingIds = bookings.map((booking) => booking.id);
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(
      "id, booking_id, job_reference, status, assigned_mechanic_user_id, assigned_mechanic_name, assigned_mechanic_phone, scheduled_for, ops_notes, created_at, updated_at",
    )
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  if (jobsError) {
    throw new Error(jobsError.message || "Failed to load jobs.");
  }

  const typedJobs = (jobs ?? []) as CreatedJob[];
  const jobIds = typedJobs.map((job) => job.id);
  const hasCheckInByJobId = new Map<string, boolean>();
  const checklistTotalsByJobId = new Map<
    string,
    { total: number; completed: number }
  >();

  if (jobIds.length > 0) {
    const { data: checkIns, error: checkInsError } = await supabase
      .from("vehicle_check_ins")
      .select("job_id")
      .in("job_id", jobIds);

    if (checkInsError) {
      throw new Error(checkInsError.message || "Failed to inspect job check-ins.");
    }

    (checkIns ?? []).forEach((checkIn) => {
      hasCheckInByJobId.set(checkIn.job_id, true);
    });

    const { data: jobServices, error: jobServicesError } = await supabase
      .from("job_services")
      .select("id, job_id")
      .in("job_id", jobIds);

    if (jobServicesError) {
      throw new Error(
        jobServicesError.message || "Failed to inspect job service snapshots.",
      );
    }

    const jobIdByServiceId = new Map<string, string>();
    const jobServiceIds: string[] = [];

    (jobServices ?? []).forEach((service) => {
      jobIdByServiceId.set(service.id, service.job_id);
      jobServiceIds.push(service.id);
      checklistTotalsByJobId.set(
        service.job_id,
        checklistTotalsByJobId.get(service.job_id) ?? {
          total: 0,
          completed: 0,
        },
      );
    });

    if (jobServiceIds.length > 0) {
      const { data: checklistItems, error: checklistError } = await supabase
        .from("job_service_checklist_items")
        .select("job_service_id, is_completed")
        .in("job_service_id", jobServiceIds);

      if (checklistError) {
        throw new Error(
          checklistError.message || "Failed to inspect checklist progress.",
        );
      }

      (checklistItems ?? []).forEach((item) => {
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
  }

  const jobsByBookingId = new Map<string, AssignmentCandidateJob>();

  typedJobs.forEach((job) => {
    if (!jobsByBookingId.has(job.booking_id)) {
      const checklistTotals = checklistTotalsByJobId.get(job.id) ?? {
        total: 0,
        completed: 0,
      };
      const hasCheckIn = hasCheckInByJobId.get(job.id) ?? false;

      jobsByBookingId.set(job.booking_id, {
        ...job,
        has_check_in: hasCheckIn,
        total_checklist_items: checklistTotals.total,
        completed_checklist_items: checklistTotals.completed,
        can_unassign: !hasCheckIn && checklistTotals.completed === 0,
      });
    }
  });

  return bookings.map((booking) => ({
    id: booking.id,
    booking_number: booking.booking_number,
    full_name: booking.full_name,
    phone: booking.phone,
    email: booking.email,
    car_registration: booking.car_registration,
    created_at: booking.created_at,
    total_price: Number(booking.total_price),
    selected_services: booking.selected_services,
    existing_job: jobsByBookingId.get(booking.id) ?? null,
  }));
}
