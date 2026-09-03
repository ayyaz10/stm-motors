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

const mechanicApplicationSelect =
  "id, created_at, updated_at, submitted_at, status, first_name, last_name, email, phone, postcode, business_name, mechanic_type, years_experience, service_radius_miles, website_url, qualifications_summary, insurance_held, services_offered, work_types, has_diagnostic_tools, has_service_van, additional_notes, review_note, reviewed_at, approved_at, approved_by, auth_user_id, invite_sent_at";

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toOptionalInteger(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numeric = Number.parseInt(trimmed, 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function normaliseStringArray(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
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
): Promise<MechanicApplicationRecord> {
  if (!input.mechanicType) {
    throw new Error("Choose a mechanic type before applying.");
  }

  const nowIso = new Date().toISOString();
  const applicationId = crypto.randomUUID();

  const insertPayload = {
    id: applicationId,
    created_at: nowIso,
    updated_at: nowIso,
    submitted_at: nowIso,
    status: "submitted" as const,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    postcode: input.postcode.trim().toUpperCase(),
    business_name: trimOrNull(input.businessName),
    mechanic_type: input.mechanicType,
    years_experience: toOptionalInteger(input.yearsExperience),
    service_radius_miles: toOptionalInteger(input.serviceRadiusMiles),
    website_url: trimOrNull(input.websiteUrl),
    qualifications_summary: trimOrNull(input.qualificationsSummary),
    insurance_held: normaliseStringArray(input.insuranceHeld),
    services_offered: normaliseStringArray(input.servicesOffered),
    work_types: normaliseStringArray(input.workTypes),
    has_diagnostic_tools: input.hasDiagnosticTools,
    has_service_van: input.hasServiceVan,
    additional_notes: trimOrNull(input.additionalNotes),
  };

  const { error } = await supabase
    .from("mechanic_applications")
    .insert(insertPayload);

  if (error) {
    throw new Error(error.message || "Failed to submit the application.");
  }

  return mapMechanicApplicationRecord({
    id: applicationId,
    created_at: nowIso,
    updated_at: nowIso,
    submitted_at: nowIso,
    status: "submitted",
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    postcode: input.postcode.trim().toUpperCase(),
    business_name: trimOrNull(input.businessName),
    mechanic_type: input.mechanicType,
    years_experience: toOptionalInteger(input.yearsExperience),
    service_radius_miles: toOptionalInteger(input.serviceRadiusMiles),
    website_url: trimOrNull(input.websiteUrl),
    qualifications_summary: trimOrNull(input.qualificationsSummary),
    insurance_held: normaliseStringArray(input.insuranceHeld),
    services_offered: normaliseStringArray(input.servicesOffered),
    work_types: normaliseStringArray(input.workTypes),
    has_diagnostic_tools: input.hasDiagnosticTools,
    has_service_van: input.hasServiceVan,
    additional_notes: trimOrNull(input.additionalNotes),
    review_note: null,
    reviewed_at: null,
    approved_at: null,
    approved_by: null,
    auth_user_id: null,
    invite_sent_at: null,
  });
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
