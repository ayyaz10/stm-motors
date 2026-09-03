export interface ContactEnquiryEmailInput {
  email: string;
  enquiryType: "general" | "service" | "buy-car" | "sell-car";
  message: string;
  name: string;
  phone: string | null;
  service: string | null;
  sourceUrl: string;
  submittedAt: string;
}

export interface PreparedContactEmail {
  subject: string;
  html: string;
  text: string;
}

const enquiryTypeLabels: Record<ContactEnquiryEmailInput["enquiryType"], string> = {
  general: "General enquiry",
  service: "Car service or repair",
  "buy-car": "Buy a car",
  "sell-car": "Sell my car",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  dateStyle: "medium",
  timeStyle: "short",
});

function displayValue(value: string | null | undefined): string {
  return value?.trim() ? value : "Not provided";
}

function sectionCard(
  heading: string,
  content: string,
  background = "#ffffff",
): string {
  return `
    <tr>
      <td style="padding: 0 0 16px;">
        <div style="border: 1px solid #d9e5fb; border-radius: 18px; padding: 20px; background: ${background};">
          <div style="font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #1c69d4; margin-bottom: 10px;">
            ${escapeHtml(heading)}
          </div>
          ${content}
        </div>
      </td>
    </tr>
  `;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatSubmittedAt(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function buildAdminContactEmail(
  input: ContactEnquiryEmailInput,
): PreparedContactEmail {
  const enquiryLabel = enquiryTypeLabels[input.enquiryType];
  const subject = `New STM Motors Contact Enquiry - ${enquiryLabel} - ${input.name}`;

  const html = `
    <!doctype html>
    <html lang="en">
      <body style="margin: 0; padding: 0; background: #f4f8ff; font-family: Arial, Helvetica, sans-serif; color: #0b1730;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f4f8ff; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 720px; background: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #d9e5fb;">
                <tr>
                  <td style="padding: 28px 28px 20px; background: #1c69d4; color: #ffffff;">
                    <div style="font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.76);">
                      STM Motors
                    </div>
                    <h1 style="margin: 12px 0 10px; font-size: 32px; line-height: 1.15; font-weight: 700; color: #ffffff;">
                      New contact enquiry received
                    </h1>
                    <p style="margin: 0; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.88);">
                      A new contact form enquiry was submitted on ${escapeHtml(input.sourceUrl)}.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 28px 12px;">
                    ${sectionCard(
                      "Enquiry summary",
                      `
                        <p style="margin: 0 0 8px; font-size: 18px; line-height: 1.5; font-weight: 700; color: #0b1730;">${escapeHtml(enquiryLabel)}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #50627e;">Submitted ${escapeHtml(formatSubmittedAt(input.submittedAt))}</p>
                      `,
                      "#f8fbff",
                    )}
                    ${sectionCard(
                      "Customer",
                      `
                        <p style="margin: 0 0 8px; font-size: 18px; line-height: 1.5; font-weight: 700; color: #0b1730;">${escapeHtml(input.name)}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #23324f;">Email: ${escapeHtml(input.email)}<br />Phone: ${escapeHtml(displayValue(input.phone))}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Service requested",
                      `
                        <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #23324f;">${escapeHtml(displayValue(input.service))}</p>
                      `,
                    )}
                    ${sectionCard(
                      "Message",
                      `
                        <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #23324f; white-space: pre-wrap;">${escapeHtml(input.message)}</p>
                      `,
                    )}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 28px 28px; font-size: 13px; line-height: 1.7; color: #50627e;">
                    Reply directly to ${escapeHtml(input.email)} to continue this conversation.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = [
    "STM Motors - New contact enquiry received",
    "",
    `Enquiry type: ${enquiryLabel}`,
    `Submitted at: ${formatSubmittedAt(input.submittedAt)}`,
    `Source URL: ${input.sourceUrl}`,
    "",
    "Customer",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${displayValue(input.phone)}`,
    "",
    `Service requested: ${displayValue(input.service)}`,
    "",
    "Message",
    input.message,
  ].join("\n");

  return { subject, html, text };
}
