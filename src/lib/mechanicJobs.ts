import {
  deriveJobProgressStatus,
  type DerivedJobProgressStatus,
} from "./jobProgress";
import { supabase } from "./supabase";
import type { CreatedJob } from "./jobs";

export interface MechanicDashboardJob {
  job: CreatedJob;
  booking: {
    id: string;
    booking_number: string;
    full_name: string | null;
    phone: string | null;
    car_registration: string;
    city: string | null;
    postcode: string | null;
  };
  checklistTotals: {
    total: number;
    completed: number;
  };
  checkIn: {
    isSubmitted: boolean;
    submittedAt: string | null;
    submittedBy: string | null;
  };
  progressStatus: DerivedJobProgressStatus;
}

export async function fetchMechanicDashboardJobs(
  mechanicUserId: string,
): Promise<MechanicDashboardJob[]> {
  const { data: jobsData, error: jobsError } = await supabase
    .from("jobs")
    .select(
      "id, booking_id, job_reference, status, booking_number_snapshot, car_registration_snapshot, vehicle_summary_snapshot, assigned_mechanic_user_id, assigned_mechanic_name, assigned_mechanic_phone, scheduled_for, scheduled_arrival_window, ops_notes, created_at, updated_at",
    )
    .eq("assigned_mechanic_user_id", mechanicUserId)
    .order("created_at", { ascending: false });

  if (jobsError) {
    throw new Error(jobsError.message || "Failed to load mechanic jobs.");
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
    .select("job_id, submitted_at, mechanic_name")
    .in("job_id", jobIds)
    .order("submitted_at", { ascending: false });

  if (checkInsError) {
    throw new Error(checkInsError.message || "Failed to load check-in progress.");
  }

  const latestCheckInByJobId = new Map<
    string,
    { submitted_at: string; mechanic_name: string | null }
  >();

  (checkInsData ?? []).forEach((checkIn) => {
    if (!latestCheckInByJobId.has(checkIn.job_id)) {
      latestCheckInByJobId.set(checkIn.job_id, {
        submitted_at: checkIn.submitted_at,
        mechanic_name: checkIn.mechanic_name,
      });
    }
  });

  const { data: jobServicesData, error: jobServicesError } = await supabase
    .from("job_services")
    .select("id, job_id")
    .in("job_id", jobIds);

  if (jobServicesError) {
    throw new Error(jobServicesError.message || "Failed to load job services.");
  }

  const jobServices = (jobServicesData ?? []) as Array<{
    id: string;
    job_id: string;
  }>;
  const jobIdByServiceId = new Map(
    jobServices.map((service) => [service.id, service.job_id]),
  );
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

      const checklistTotals = checklistTotalsByJobId.get(job.id) ?? {
        total: 0,
        completed: 0,
      };
      const checkIn = latestCheckInByJobId.get(job.id);

      return {
        job,
        booking: {
          id: booking?.id ?? job.booking_id,
          booking_number:
            booking?.booking_number ?? job.booking_number_snapshot ?? "Booking",
          full_name: booking?.full_name ?? null,
          phone: booking?.phone ?? null,
          car_registration:
            booking?.car_registration ?? job.car_registration_snapshot ?? "Vehicle",
          city: booking?.city ?? null,
          postcode: booking?.postcode ?? null,
        },
        checklistTotals,
        checkIn: {
          isSubmitted: Boolean(checkIn),
          submittedAt: checkIn?.submitted_at ?? null,
          submittedBy: checkIn?.mechanic_name ?? null,
        },
        progressStatus: deriveJobProgressStatus(
          job.status,
          Boolean(checkIn),
          checklistTotals.completed,
          checklistTotals.total,
        ),
      } satisfies MechanicDashboardJob;
    })
    .filter((item): item is MechanicDashboardJob => item !== null);
}
