import { supabase } from "./supabase";

export type ContactEnquiryType =
  | "general"
  | "service"
  | "buy-car"
  | "sell-car";

export interface ContactEnquiryPayload {
  name: string;
  email: string;
  phone: string;
  enquiryType: ContactEnquiryType;
  service: string;
  message: string;
  sourceUrl?: string;
  captchaToken?: string;
  website?: string;
}

interface SubmitContactFormResponse {
  success?: boolean;
  error?: string;
}

export async function submitContactEnquiry(
  payload: ContactEnquiryPayload,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke<
    SubmitContactFormResponse
  >("submit-contact-form", {
    body: payload,
  });

  if (error) {
    const responseContext = (error as { context?: Response }).context;

    if (responseContext) {
      try {
        const result = (await responseContext
          .clone()
          .json()) as SubmitContactFormResponse;

        if (result?.error) {
          throw new Error(result.error);
        }
      } catch {
        // Fall through to the generic error below when the response body is unavailable.
      }
    }

    throw new Error(error.message || "Failed to send your message.");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to send your message.");
  }
}
