import { mechanicServiceLabelMap } from "../data/mechanicServiceOptions";
import type { MechanicApplicationInput } from "./mechanicApplications";

const FORM_SUBMIT_TARGET_EMAIL = "ayyazahmad009@gmail.com";
const FORM_SUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${FORM_SUBMIT_TARGET_EMAIL}`;

interface FormSubmitFieldMap {
  [key: string]: string;
}

const mechanicTypeLabels: Record<string, string> = {
  mobile_mechanic: "Mobile mechanic",
  garage_and_mobile: "Garage + mobile",
  garage_based: "Garage-based",
};

const mechanicWorkTypeLabels: Record<string, string> = {
  mobile_service: "Mobile mechanic service",
  customer_drop_off: "Customer drop-off",
  collection_delivery: "Collection and delivery",
};

const insuranceLabels: Record<string, string> = {
  trade_insurance: "Trade insurance",
  public_liability: "Public liability insurance",
  no_current_insurance: "No current insurance",
};

function appendFields(formData: FormData, fields: FormSubmitFieldMap) {
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
}

function joinList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None provided";
}

function formatMappedLabels(
  values: string[],
  labels: Record<string, string>,
): string {
  return joinList(values.map((value) => labels[value] ?? value));
}

async function submitFormSubmitEmail(
  fields: FormSubmitFieldMap,
): Promise<void> {
  const formData = new FormData();

  formData.append("_subject", fields._subject ?? "STM Motors submission");
  formData.append("_template", "table");

  if (typeof window !== "undefined" && window.location.href) {
    formData.append("_url", window.location.href);
  }

  appendFields(formData, fields);

  const response = await fetch(FORM_SUBMIT_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `FormSubmit request failed with status ${response.status}.`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const result = (await response.json()) as {
      success?: string;
      message?: string;
    };

    if (
      typeof result.success === "string" &&
      result.success.toLowerCase() !== "true"
    ) {
      throw new Error(result.message || "FormSubmit rejected the request.");
    }
  }
}

export async function sendMechanicApplicationNotificationEmail(input: {
  applicationId: string;
  submittedAt: string;
  formState: MechanicApplicationInput;
}): Promise<void> {
  const { applicationId, submittedAt, formState } = input;
  const plainMessage = [
    "New mechanic application received.",
    `Name: ${formState.firstName.trim()} ${formState.lastName.trim()}`,
    `Email: ${formState.email.trim().toLowerCase()}`,
    `Phone: ${formState.phone.trim()}`,
    `Mechanic type: ${mechanicTypeLabels[formState.mechanicType] || "Not provided"}`,
    `Services: ${formatMappedLabels(formState.servicesOffered, mechanicServiceLabelMap)}`,
  ].join("\n");

  await submitFormSubmitEmail({
    _subject: `New mechanic application - ${formState.firstName} ${formState.lastName}`,
    _replyto: formState.email,
    name: `${formState.firstName.trim()} ${formState.lastName.trim()}`,
    email: formState.email.trim().toLowerCase(),
    phone: formState.phone.trim(),
    "Submission Type": "Mechanic application",
    "Application ID": applicationId,
    "Submitted At": submittedAt,
    "First Name": formState.firstName.trim(),
    "Last Name": formState.lastName.trim(),
    Email: formState.email.trim().toLowerCase(),
    Phone: formState.phone.trim(),
    Postcode: formState.postcode.trim().toUpperCase(),
    "Business Name": formState.businessName.trim() || "None provided",
    "Mechanic Type":
      mechanicTypeLabels[formState.mechanicType] || "Not provided",
    "Years Experience": formState.yearsExperience.trim() || "Not provided",
    "Service Radius (miles)":
      formState.serviceRadiusMiles.trim() || "Not provided",
    Website: formState.websiteUrl.trim() || "None provided",
    Qualifications: formState.qualificationsSummary.trim() || "None provided",
    Insurance: formatMappedLabels(formState.insuranceHeld, insuranceLabels),
    Services: formatMappedLabels(
      formState.servicesOffered,
      mechanicServiceLabelMap,
    ),
    "Work Types": formatMappedLabels(
      formState.workTypes,
      mechanicWorkTypeLabels,
    ),
    "Has Diagnostic Tools":
      formState.hasDiagnosticTools === null
        ? "Not provided"
        : formState.hasDiagnosticTools
          ? "Yes"
          : "No",
    "Has Service Van":
      formState.hasServiceVan === null
        ? "Not provided"
        : formState.hasServiceVan
          ? "Yes"
          : "No",
    "Additional Notes": formState.additionalNotes.trim() || "None provided",
    Message: plainMessage,
    message: plainMessage,
  });
}
