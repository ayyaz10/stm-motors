import { supabase } from "./supabase";

export type MechanicApplicationType =
  | "mobile_mechanic"
  | "garage_and_mobile"
  | "garage_based";

export type MechanicApplicationStatus =
  | "submitted"
  | "under_review"
  | "needs_info"
  | "approved"
  | "rejected";

export interface MechanicApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  businessName: string;
  mechanicType: MechanicApplicationType | "";
  yearsExperience: string;
  serviceRadiusMiles: string;
  websiteUrl: string;
  qualificationsSummary: string;
  insuranceHeld: string[];
  servicesOffered: string[];
  workTypes: string[];
  hasDiagnosticTools: boolean | null;
  hasServiceVan: boolean | null;
  additionalNotes: string;
}

export interface MechanicApplicationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
  status: MechanicApplicationStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  businessName: string | null;
  mechanicType: MechanicApplicationType;
  yearsExperience: number | null;
  serviceRadiusMiles: number | null;
  websiteUrl: string | null;
  qualificationsSummary: string | null;
  insuranceHeld: string[];
  servicesOffered: string[];
  workTypes: string[];
  hasDiagnosticTools: boolean | null;
  hasServiceVan: boolean | null;
  additionalNotes: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  authUserId: string | null;
  inviteSentAt: string | null;
}

interface MechanicApplicationRow {
  id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  status: MechanicApplicationStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  postcode: string;
  business_name: string | null;
  mechanic_type: MechanicApplicationType;
  years_experience: number | null;
  service_radius_miles: number | null;
  website_url: string | null;
  qualifications_summary: string | null;
  insurance_held: string[] | null;
  services_offered: string[] | null;
  work_types: string[] | null;
  has_diagnostic_tools: boolean | null;
  has_service_van: boolean | null;
  additional_notes: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  auth_user_id: string | null;
  invite_sent_at: string | null;
}

interface ApproveMechanicApplicationResponse {
  application: MechanicApplicationRow;
}

interface SubmitMechanicApplicationResponse {
  application?: MechanicApplicationRow;
  notificationSent?: boolean;
  error?: string;
}

const mechanicApplicationSelect =
  "id, created_at, updated_at, submitted_at, status, first_name, last_name, email, phone, postcode, business_name, mechanic_type, years_experience, service_radius_miles, website_url, qualifications_summary, insurance_held, services_offered, work_types, has_diagnostic_tools, has_service_van, additional_notes, review_note, reviewed_at, approved_at, approved_by, auth_user_id, invite_sent_at";

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapMechanicApplicationRecord(
  row: MechanicApplicationRow,
): MechanicApplicationRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    postcode: row.postcode,
    businessName: row.business_name,
    mechanicType: row.mechanic_type,
    yearsExperience: row.years_experience,
    serviceRadiusMiles: row.service_radius_miles,
    websiteUrl: row.website_url,
    qualificationsSummary: row.qualifications_summary,
    insuranceHeld: row.insurance_held ?? [],
    servicesOffered: row.services_offered ?? [],
    workTypes: row.work_types ?? [],
    hasDiagnosticTools: row.has_diagnostic_tools,
    hasServiceVan: row.has_service_van,
    additionalNotes: row.additional_notes,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    authUserId: row.auth_user_id,
    inviteSentAt: row.invite_sent_at,
  };
}

export async function submitMechanicApplication(
  input: MechanicApplicationInput,
  captchaToken: string,
  applicationId: string,
): Promise<MechanicApplicationRecord> {
  if (!input.mechanicType) {
    throw new Error("Choose a mechanic type before applying.");
  }

  const { data, error } = await supabase.functions.invoke<
    SubmitMechanicApplicationResponse
  >("submit-mechanic-application", {
    body: { ...input, applicationId, captchaToken },
  });

  if (error) {
    const responseContext = (error as { context?: Response }).context;
    if (responseContext) {
      let response: SubmitMechanicApplicationResponse | null = null;
      try {
        response = (await responseContext.clone().json()) as SubmitMechanicApplicationResponse;
      } catch {
        // Use the function client error when no JSON response body is available.
      }
      if (response?.error) throw new Error(response.error);
    }
    throw new Error(error.message || "Failed to submit the application.");
  }

  if (!data?.application) {
    throw new Error(data?.error || "Application submission returned no record.");
  }

  return mapMechanicApplicationRecord(data.application);
}

export async function fetchMechanicApplications(): Promise<
  MechanicApplicationRecord[]
> {
  const { data, error } = await supabase
    .from("mechanic_applications")
    .select(mechanicApplicationSelect)
    .order("submitted_at", { ascending: false })
    .returns<MechanicApplicationRow[]>();

  if (error) {
    throw new Error(
      error.message || "Failed to load mechanic applications.",
    );
  }

  return (data ?? []).map(mapMechanicApplicationRecord);
}

export async function deleteMechanicApplication(
  applicationId: string,
): Promise<void> {
  const { error, count } = await supabase
    .from("mechanic_applications")
    .delete({ count: "exact" })
    .eq("id", applicationId)
    .neq("status", "approved")
    .is("auth_user_id", null);

  if (error) {
    throw new Error(error.message || "Failed to delete the application.");
  }

  if (!count) {
    throw new Error(
      "This application cannot be deleted because it is approved, linked to a staff account, or no longer exists.",
    );
  }
}

export async function updateMechanicApplicationReview(input: {
  applicationId: string;
  status: Exclude<MechanicApplicationStatus, "approved">;
  reviewNote?: string;
}): Promise<MechanicApplicationRecord> {
  const { data, error } = await supabase
    .from("mechanic_applications")
    .update({
      status: input.status,
      review_note: trimOrNull(input.reviewNote ?? ""),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId)
    .select(mechanicApplicationSelect)
    .single<MechanicApplicationRow>();

  if (error) {
    throw new Error(
      error.message || "Failed to update the application review.",
    );
  }

  return mapMechanicApplicationRecord(data);
}

export async function approveMechanicApplication(
  applicationId: string,
): Promise<MechanicApplicationRecord> {
  const { data, error } = await supabase.functions.invoke<
    ApproveMechanicApplicationResponse
  >("approve-mechanic-application", {
    body: { applicationId },
  });

  if (error) {
    throw new Error(error.message || "Failed to approve the application.");
  }

  if (!data?.application) {
    throw new Error("Approval completed, but no application was returned.");
  }

  return mapMechanicApplicationRecord(data.application);
}
