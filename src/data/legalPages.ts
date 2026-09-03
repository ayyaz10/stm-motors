import { contactDetails } from "./siteContent";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  numbered?: string[];
  note?: string;
}

export interface LegalPageDefinition {
  category: "Privacy and data" | "Booking and service" | "Business and website";
  description: string;
  id: string;
  lastUpdated: string;
  metaDescription: string;
  pathname: string;
  sections: LegalSection[];
  summary: string;
  title: string;
}

const lastUpdated = "7 August 2026";
const websiteUrl = "https://stmmotors.com";
const bookingEmail = contactDetails.email;
const phoneNumber = contactDetails.phone;
const contactPage = `${websiteUrl}/contact`;

const processorBullets = [
  "Supabase for booking records, form submissions, authentication, and operational workflow data.",
  "Resend for sending booking confirmations, contact enquiries, and related transactional emails.",
  "Google reCAPTCHA for abuse prevention and contact form spam protection.",
];

export const legalPages: LegalPageDefinition[] = [
  {
    id: "privacy-policy",
    pathname: "/legal/privacy-policy",
    title: "Privacy Policy",
    category: "Privacy and data",
    summary:
      "How STM Motors collects, uses, shares, and protects customer and website visitor information.",
    description:
      "Read how STM Motors handles personal data for bookings, enquiries, service visits, and website use.",
    metaDescription:
      "STM Motors privacy policy covering bookings, enquiries, website use, cookies, reCAPTCHA, and customer rights.",
    lastUpdated,
    sections: [
      {
        title: "Who this notice covers",
        paragraphs: [
          "This privacy policy explains how STM Motors uses personal data when you contact us, request a quote, submit a booking, ask about buying or selling a car, browse the website, or otherwise interact with our team.",
          `The main contact details used for privacy questions on this website are ${bookingEmail} and ${phoneNumber}.`,
        ],
      },
      {
        title: "Information we collect",
        bullets: [
          "Identity and contact details such as your name, phone number, email address, and postcode.",
          "Booking details such as your vehicle registration, service selections, address, submitted availability, and service notes.",
          "Enquiry information you choose to send through contact forms, car buying or selling enquiries, or direct email.",
          "Technical and anti-abuse information needed to keep the website secure, including Google reCAPTCHA checks where enabled.",
        ],
      },
      {
        title: "How we use your information",
        paragraphs: [
          "We use personal data to answer enquiries, arrange bookings, confirm appointments, manage customer service, prevent spam and fraud, and keep a record of services requested or completed.",
          "Where relevant, we also use your information to meet legal, tax, accounting, consumer protection, and dispute-handling obligations.",
        ],
        bullets: [
          "To prepare, confirm, or manage a service booking.",
          "To reply to customer messages and service questions.",
          "To send booking, contact, and operational emails.",
          "To review service demand, booking history, and operational quality in a proportionate way.",
        ],
      },
      {
        title: "Our main lawful bases",
        bullets: [
          "Contract: when we need your information to arrange, supply, or support a booked service.",
          "Legitimate interests: to run the business, respond to enquiries, maintain records, and protect the website from misuse.",
          "Legal obligation: where we must keep records or disclose information to comply with law or regulation.",
          "Consent: where a specific activity relies on consent, such as optional future marketing if that is ever introduced.",
        ],
      },
      {
        title: "Who we share information with",
        paragraphs: [
          "We do not sell customer data. We share information only where it is reasonably necessary to run the service, keep the site secure, or meet legal obligations.",
        ],
        bullets: processorBullets,
      },
      {
        title: "How long we keep information",
        paragraphs: [
          "We keep enquiry and booking information only for as long as it is reasonably needed for customer support, business records, service follow-up, complaint handling, and legal or tax obligations.",
          "Retention periods may differ depending on whether the data relates to a simple enquiry, a completed booking, an unresolved complaint, or a regulatory requirement.",
        ],
      },
      {
        title: "Cookies, reCAPTCHA, and website security",
        paragraphs: [
          "This website uses security and functionality tools, including Google reCAPTCHA where enabled, to reduce spam and misuse. These tools may process device or browser information as part of that security check.",
          "For more detail about website cookies and similar technologies, see the STM Motors Cookie Policy.",
        ],
      },
      {
        title: "Your rights",
        bullets: [
          "You can ask for access to personal data we hold about you.",
          "You can ask us to correct inaccurate or incomplete information.",
          "You can ask for deletion where there is no good reason for us to keep the data.",
          "You can object to or restrict certain processing in appropriate cases.",
          "You can raise a complaint with the UK Information Commissioner's Office if you believe data protection law has been handled badly.",
        ],
        note: `The quickest way to raise a privacy request with STM Motors is via ${bookingEmail}.`,
      },
    ],
  },
  {
    id: "mechanic-applicant-privacy",
    pathname: "/legal/mechanic-applicant-privacy",
    title: "Mechanic Applicant Privacy Notice",
    category: "Privacy and data",
    summary:
      "How STM Motors handles personal data submitted by mechanics who apply to join the platform or service network.",
    description:
      "Read how STM Motors handles mechanic application information, approval checks, and applicant records.",
    metaDescription:
      "STM Motors privacy notice for mechanic applicants covering application data, review, approvals, and records.",
    lastUpdated,
    sections: [
      {
        title: "What this notice covers",
        paragraphs: [
          "This notice applies to mechanics and related businesses who submit an application through the STM Motors website or who provide supporting information during the approval process.",
        ],
      },
      {
        title: "Applicant information we may collect",
        bullets: [
          "Name, email, phone number, postcode, and business or trading name.",
          "Mechanic type, service coverage, qualifications summary, insurance details, and experience information.",
          "Notes you submit about tools, vehicle types, service capability, and related background.",
          "Operational records created during internal review, approval, rejection, or requests for more information.",
        ],
      },
      {
        title: "Why we use applicant data",
        bullets: [
          "To review whether an applicant is suitable for STM Motors work opportunities.",
          "To communicate about the application, approval status, onboarding, or follow-up questions.",
          "To protect customers, bookings, and the wider operational workflow.",
          "To maintain internal records about applications, decisions, and platform access.",
        ],
      },
      {
        title: "Lawful bases and internal sharing",
        paragraphs: [
          "Applicant information is usually processed on the basis of legitimate interests and, where relevant, steps requested before entering a contract or onboarding relationship.",
          "Information may be reviewed by authorised STM Motors staff involved in operations, approvals, scheduling, or account setup.",
        ],
      },
      {
        title: "Retention and outcomes",
        paragraphs: [
          "We keep application records for only as long as reasonably required for recruitment-style review, fraud prevention, dispute handling, operational records, and legal obligations.",
          "Where an applicant is approved, relevant details may continue to be used as part of the mechanic account and job workflow.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          `Mechanic applicants can contact ${bookingEmail} to request access, correction, or other privacy support in line with applicable data protection law.`,
        ],
      },
    ],
  },
  {
    id: "cookie-policy",
    pathname: "/legal/cookie-policy",
    title: "Cookie Policy",
    category: "Privacy and data",
    summary:
      "A practical overview of the cookies and similar technologies used to run and secure the STM Motors website.",
    description:
      "Understand the cookies and similar technologies used by STM Motors, including security tools like reCAPTCHA.",
    metaDescription:
      "STM Motors cookie policy covering essential cookies, security tools, reCAPTCHA, and browser controls.",
    lastUpdated,
    sections: [
      {
        title: "What cookies are",
        paragraphs: [
          "Cookies are small pieces of data stored in your browser. Similar technologies can also use local storage, session identifiers, or security tokens to keep services working properly.",
        ],
      },
      {
        title: "How STM Motors uses them",
        bullets: [
          "To keep essential parts of the website working correctly.",
          "To support staff login, secure sessions, and operational access where relevant.",
          "To reduce spam, abuse, or automated misuse through tools such as Google reCAPTCHA.",
          "To remember limited functional preferences where this is necessary for the user journey.",
        ],
      },
      {
        title: "Security and anti-spam tools",
        paragraphs: [
          "When Google reCAPTCHA is enabled on forms, Google may set cookies or process browser data to assess whether a submission appears genuine. This helps protect the contact and booking journeys from abuse.",
        ],
      },
      {
        title: "Non-essential cookies",
        paragraphs: [
          "STM Motors does not intend this page to claim the use of broad advertising or behavioural tracking cookies unless those are actually introduced. If non-essential analytics, advertising, or personalisation tools are added later, this policy and any related consent mechanism should be updated before relying on them.",
        ],
      },
      {
        title: "Managing cookies",
        bullets: [
          "You can change or delete cookies through your browser settings.",
          "Blocking essential cookies may affect booking, login, or security-related parts of the website.",
          "Where consent is required for future non-essential tools, STM Motors should offer that choice separately from essential website functions.",
        ],
        note: `Questions about cookies or website privacy can be sent to ${bookingEmail}.`,
      },
    ],
  },
  {
    id: "booking-terms",
    pathname: "/legal/booking-terms",
    title: "Booking Terms and Service Conditions",
    category: "Booking and service",
    summary:
      "The core booking conditions for STM Motors mobile services, including pricing, suitability, access, changes, and service limits.",
    description:
      "Read the booking terms that apply to STM Motors mobile service appointments, quotes, access, and customer responsibilities.",
    metaDescription:
      "STM Motors booking terms covering mobile service appointments, pricing, quotes, site suitability, and customer responsibilities.",
    lastUpdated,
    sections: [
      {
        title: "How bookings work",
        paragraphs: [
          "STM Motors provides mobile vehicle services arranged through the website, direct contact, or manual confirmation. A booking request does not always guarantee that every job can be completed exactly as first described until the vehicle, location, and required parts are reasonably confirmed.",
        ],
      },
      {
        title: "Pricing and quotes",
        bullets: [
          "Some services may be offered with a published price, while others require confirmation after review.",
          "Where a job depends on inspection, vehicle specification, additional parts, or conditions found on arrival, STM Motors may confirm or revise the quote before work begins.",
          "No extra work should be treated as approved unless the customer has accepted it.",
        ],
      },
      {
        title: "Home, workplace, and on-site suitability",
        bullets: [
          "Mobile service depends on a safe, lawful, and practical working location.",
          "If access, safety, weather, parking, space, lighting, or local restrictions make on-site work unsuitable, STM Motors may need to reschedule, adapt the job, or decline to proceed.",
          "The vehicle should be reasonably accessible, and keys or authorisation should be available at the agreed time.",
        ],
      },
      {
        title: "Customer responsibilities",
        bullets: [
          "Provide accurate booking, address, and vehicle details.",
          "Tell STM Motors about known faults, warnings, access issues, or non-standard vehicle modifications where relevant.",
          "Make sure the vehicle can legally and safely be worked on at the chosen location.",
          "Review booking confirmations and raise errors as soon as possible.",
        ],
      },
      {
        title: "Appointment windows and changes",
        paragraphs: [
          "Submitted availability helps STM Motors allocate a suitable visit, but the final arrival window may be confirmed later. Travel conditions, emergencies, parts supply, weather, or operational issues can require timing changes.",
        ],
      },
      {
        title: "Parts, diagnosis, and additional work",
        bullets: [
          "Some jobs can only be confirmed properly after inspection or diagnosis.",
          "If extra parts or wider repairs are needed, STM Motors should explain the next step before proceeding.",
          "Customer-supplied parts may be declined or handled only on terms agreed in advance.",
        ],
      },
      {
        title: "Payment and completion",
        paragraphs: [
          "Payment timing, method, and any invoice terms should be confirmed during the booking process or before work starts. Where a quote is revised or a job is partly completed for a valid reason, the amount due should reflect what was actually agreed or supplied.",
        ],
      },
      {
        title: "Consumer rights",
        paragraphs: [
          "These terms sit alongside applicable consumer law. Nothing in them is intended to remove or limit rights that cannot legally be excluded.",
        ],
      },
    ],
  },
  {
    id: "cancellation-refund-policy",
    pathname: "/legal/cancellations-refunds",
    title: "Cancellation, Refund, and Rescheduling Policy",
    category: "Booking and service",
    summary:
      "How STM Motors handles booking changes, customer cancellations, cooling-off considerations, and refund situations.",
    description:
      "Read the STM Motors cancellation, refund, and rescheduling policy for mobile bookings and service changes.",
    metaDescription:
      "STM Motors cancellation and refund policy covering booking changes, cooling-off considerations, rescheduling, and approved refunds.",
    lastUpdated,
    sections: [
      {
        title: "Rescheduling a booking",
        paragraphs: [
          "If you need to move an appointment, contact STM Motors as early as possible. We will try to offer another suitable slot based on service area coverage, mechanic availability, and any parts or operational constraints already attached to the booking.",
        ],
      },
      {
        title: "Cancelling before work starts",
        bullets: [
          "You can ask to cancel before work starts, but any non-returnable parts or wasted operational costs should only be charged where that outcome has been explained fairly and in advance.",
          "If special-order parts have already been sourced specifically for your booking, refundability may depend on the supplier's return position and the condition of those parts.",
        ],
      },
      {
        title: "Cooling-off and urgent start requests",
        paragraphs: [
          "Where a booking is made at a distance, consumer cancellation rights may apply. If you ask STM Motors to attend or begin work during any applicable cooling-off period, you may be asked to confirm that work can start earlier and that charges may still apply for work already carried out.",
        ],
      },
      {
        title: "Missed appointments or inaccessible vehicles",
        paragraphs: [
          "If a vehicle is unavailable, unsafe to access, or not in a workable condition when the visit has been arranged, STM Motors may need to reschedule. Any charge for a wasted visit should only be applied where it has been clearly explained beforehand.",
        ],
      },
      {
        title: "Refunds",
        bullets: [
          "Approved refunds should normally be returned using the original payment method where possible.",
          "Refund timing can depend on the payment provider or bank processing times.",
          "A refund decision may differ from a warranty claim, a quote revision, or a complaint about workmanship, depending on the facts.",
        ],
      },
      {
        title: "Questions about a booking change",
        note: `For booking changes or cancellation questions, contact STM Motors through the contact page or by using ${bookingEmail}.`,
      },
    ],
  },
  {
    id: "warranty-terms",
    pathname: "/legal/warranty",
    title: "Warranty Terms",
    category: "Booking and service",
    summary:
      "The STM Motors 12-month warranty baseline for parts and repairs supplied through the service booking.",
    description:
      "Read the STM Motors warranty terms, including what the 12-month cover includes and what is excluded.",
    metaDescription:
      "STM Motors warranty terms covering 12-month parts and repair cover, exclusions, claims, and remedies.",
    lastUpdated,
    sections: [
      {
        title: "What is covered",
        paragraphs: [
          "Where STM Motors states that a 12-month warranty applies, that warranty is intended to cover faults arising from parts supplied by STM Motors and the workmanship of the related repair, for 12 months from the completion date of the covered job.",
        ],
        bullets: [
          "Covered work should relate to the specific repair or replacement supplied by STM Motors.",
          "Support may include inspection, repair, replacement, or another fair remedy depending on the issue found.",
        ],
      },
      {
        title: "What is not covered",
        bullets: [
          "Normal wear and tear, unrelated faults, or issues caused by later damage, misuse, neglect, or accident.",
          "Problems caused by customer-supplied parts unless STM Motors expressly accepted responsibility for them.",
          "Faults outside the original scope of the covered repair.",
          "Consequential losses or business interruption unless the law requires otherwise.",
        ],
      },
      {
        title: "Making a warranty claim",
        bullets: [
          "Tell STM Motors about the issue as soon as reasonably possible.",
          "Provide the booking reference, vehicle details, and a clear description of the problem.",
          "Where reasonably possible, allow STM Motors a chance to inspect the issue before another repairer is instructed.",
        ],
      },
      {
        title: "What STM Motors may do",
        paragraphs: [
          "Once the issue has been assessed, STM Motors may offer an appropriate remedy such as a repair, replacement, partial refund, or another fair solution based on the actual fault and the original work supplied.",
        ],
      },
      {
        title: "Consumer rights remain separate",
        paragraphs: [
          "This warranty is intended to sit alongside your statutory consumer rights. It does not remove rights that the law gives you in relation to services, workmanship, or supplied goods.",
        ],
      },
    ],
  },
  {
    id: "complaints-policy",
    pathname: "/legal/complaints",
    title: "Complaints Policy",
    category: "Booking and service",
    summary:
      "How STM Motors handles service complaints, billing concerns, communication issues, and requests for a fair review.",
    description:
      "Read the STM Motors complaints policy for service concerns, billing questions, and escalation steps.",
    metaDescription:
      "STM Motors complaints policy explaining how to raise service concerns, what information to provide, and how complaints are handled.",
    lastUpdated,
    sections: [
      {
        title: "How to raise a complaint",
        paragraphs: [
          `If you are unhappy with a service, quote, communication, invoice, or outcome, please contact STM Motors as soon as possible using ${bookingEmail}, ${phoneNumber}, or the website contact form.`,
        ],
      },
      {
        title: "What to include",
        bullets: [
          "Your name and contact details.",
          "The vehicle registration and booking reference if available.",
          "A clear summary of what went wrong and when it happened.",
          "Photos, invoices, or related documents where helpful.",
          "What outcome you are asking for.",
        ],
      },
      {
        title: "How complaints are handled",
        paragraphs: [
          "STM Motors aims to review complaints fairly, look at the booking record and any relevant evidence, and explain the next step in plain language. Some issues can be resolved quickly, while technical or parts-related concerns may need further inspection.",
        ],
      },
      {
        title: "Possible outcomes",
        bullets: [
          "Clarification of what was booked or agreed.",
          "A further inspection or review of the work.",
          "A repair, replacement, price adjustment, or refund where appropriate.",
          "An explanation of why the complaint is not upheld, if that is the outcome after review.",
        ],
      },
      {
        title: "Consumer rights",
        paragraphs: [
          "This complaints policy does not limit any legal rights you may have. It is intended to provide a clear route for resolving issues promptly and fairly.",
        ],
      },
    ],
  },
  {
    id: "buy-sell-terms",
    pathname: "/legal/buy-sell-terms",
    title: "Buy & Sell Cars Enquiry Terms",
    category: "Booking and service",
    summary:
      "The website terms that apply when you enquire about buying a car from STM Motors or ask STM Motors about selling your own vehicle.",
    description:
      "Read the STM Motors buy and sell car enquiry terms for vehicle availability, valuations, and next-step discussions.",
    metaDescription:
      "STM Motors buy and sell car enquiry terms covering availability, valuations, vehicle descriptions, and follow-up contact.",
    lastUpdated,
    sections: [
      {
        title: "Purpose of the buy and sell forms",
        paragraphs: [
          "The buy and sell sections of this website are intended to help start a conversation. An enquiry, request for information, or request to sell a vehicle does not by itself create a binding purchase, sale, reservation, or guaranteed valuation.",
        ],
      },
      {
        title: "Vehicle availability and descriptions",
        bullets: [
          "Availability can change before a sale is formally agreed.",
          "Vehicle descriptions, images, mileage, and specifications should be treated as a helpful guide and may need final confirmation.",
          "Customers are encouraged to inspect, ask questions, and confirm key details before relying on a vehicle listing.",
        ],
      },
      {
        title: "Selling your vehicle to STM Motors",
        bullets: [
          "Any estimate or indication is subject to further review, condition, ownership checks, and supporting documents.",
          "A final buying decision may depend on inspection, history, finance status, mileage, damage, modifications, or missing paperwork.",
        ],
      },
      {
        title: "No reservation or final deal without confirmation",
        paragraphs: [
          "No vehicle should be treated as reserved, sold, purchased, or accepted for sale until STM Motors confirms the arrangement clearly and in writing or through another documented step of the process.",
        ],
      },
      {
        title: "Contact and follow-up",
        paragraphs: [
          "By using these enquiry forms, you are asking STM Motors to respond about the vehicle, valuation, or next steps connected to that request.",
        ],
      },
    ],
  },
  {
    id: "business-information",
    pathname: "/legal/business-information",
    title: "Business Information",
    category: "Business and website",
    summary:
      "Key business contact details and website-level disclosure notes for STM Motors.",
    description:
      "Read the STM Motors business information page for customer contact channels and website disclosure notes.",
    metaDescription:
      "STM Motors business information including website contact channels, service communication notes, and business disclosure guidance.",
    lastUpdated,
    sections: [
      {
        title: "Trading identity used on this website",
        paragraphs: [
          "This website operates under the STM Motors name and is used for service enquiries, booking requests, contact messages, and related customer communication.",
        ],
      },
      {
        title: "Customer contact details",
        bullets: [
          `Email: ${bookingEmail}`,
          `Phone: ${phoneNumber}`,
          `Website: ${websiteUrl}`,
          `Contact page: ${contactPage}`,
        ],
      },
      {
        title: "Service communication",
        paragraphs: [
          "Service coverage, scheduling, booking references, and any formal quote or invoice details may be confirmed through the website, email, phone, or later booking communications.",
        ],
      },
      {
        title: "Formal invoicing and trader details",
        paragraphs: [
          "Where a booking, invoice, or payment arrangement requires formal trader details, the legal or invoicing identity used for that transaction should match the records provided by STM Motors in the related commercial documents.",
          "If STM Motors later trades through a limited company, LLP, or VAT-registered structure, this page and the website footer should be updated so the relevant statutory disclosures are shown clearly.",
        ],
      },
      {
        title: "Privacy, cookies, and complaints",
        bullets: [
          "Privacy questions should be handled using the Privacy Policy and contact route on this website.",
          "Cookie and reCAPTCHA information is explained in the Cookie Policy.",
          "Service concerns and billing issues should be raised through the Complaints Policy or contact page.",
        ],
      },
    ],
  },
  {
    id: "website-terms",
    pathname: "/legal/website-terms",
    title: "Website Terms of Use",
    category: "Business and website",
    summary:
      "The baseline terms that apply when using the STM Motors website, content, forms, and customer routes.",
    description:
      "Read the STM Motors website terms of use covering site access, content, links, forms, and acceptable use.",
    metaDescription:
      "STM Motors website terms of use covering site content, forms, acceptable use, links, and legal notices.",
    lastUpdated,
    sections: [
      {
        title: "Using this website",
        paragraphs: [
          "By using the STM Motors website, you agree to use it lawfully and in a way that does not interfere with the website, the booking flow, contact forms, staff areas, or other users.",
        ],
      },
      {
        title: "Website content and service information",
        bullets: [
          "Service descriptions, examples, and page content are provided in good faith to explain what STM Motors offers.",
          "Not every service page amount, estimated time, or explanation should be treated as a guaranteed final offer until your own booking details are confirmed.",
          "STM Motors may update website content, services, wording, or availability without notice.",
        ],
      },
      {
        title: "Forms and website misuse",
        bullets: [
          "Do not submit false, abusive, automated, or misleading enquiries.",
          "Do not try to interfere with security, rate limits, reCAPTCHA, staff routes, or operational systems.",
          "STM Motors may block or ignore submissions that appear abusive, automated, or dishonest.",
        ],
      },
      {
        title: "Links and third-party services",
        paragraphs: [
          "This website may rely on third-party providers such as Google, Supabase, or Resend for technical operation. STM Motors is not responsible for the wider policies of those providers beyond its own reasonable selection and use of them.",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "The STM Motors branding, website copy, page design, and original content should not be copied or reused without permission except where law clearly allows it.",
        ],
      },
      {
        title: "Governing law",
        paragraphs: [
          "These website terms are intended to be interpreted under the laws of England and Wales, except where mandatory consumer protections in another part of the United Kingdom apply and cannot legally be excluded.",
        ],
      },
    ],
  },
];

export const legalHubCategories: Array<LegalPageDefinition["category"]> = [
  "Privacy and data",
  "Booking and service",
  "Business and website",
];

export const groupedLegalPages = legalHubCategories.map((category) => ({
  category,
  pages: legalPages.filter((page) => page.category === category),
}));

export function buildLegalTermsHref(sectionId?: string): string {
  return sectionId ? `/terms#${sectionId}` : "/terms";
}

export function findLegalPageByPath(pathname: string): LegalPageDefinition | null {
  return legalPages.find((page) => page.pathname === pathname) ?? null;
}
