import { listedServicePages } from "./servicePages";

const activeServicesCount = listedServicePages.length;

export const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Buy & Sell Cars", href: "https://stmmotors.co.uk" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Book Service", href: "/book" },
];

export const trustPillars = [
  "Clear service pages across brakes, routine servicing, diagnostics, and vehicle repair support",
  "Mobile appointments arranged around home, work, or another address",
  "A cleaner customer journey from first quote to booking confirmation",
];

export const homepageTrustStats = [
  {
    value: `${activeServicesCount} service options`,
    label: "A broader mobile offering covering routine maintenance and selected repair work",
  },
  {
    value: "UK-wide reach",
    label: "Coverage confirmed by postcode inside the booking flow",
  },
  {
    value: "Affordable pricing",
    label: "Clear totals before the booking is submitted",
  },
];

export const customerBenefits = [
  {
    title: "Convenience without the garage shuffle",
    description:
      "Routine maintenance should not eat half your day. STM Motors is designed around visits that fit home, work, and real schedules.",
  },
  {
    title: "Sharper communication",
    description:
      "From service selection to confirmation, each screen is meant to feel clear, calm, and easier to trust.",
  },
  {
    title: "Professional mobile standards",
    description:
      "Focused services, vetted mechanics, and a considered handover give the mobile experience the same seriousness as workshop care.",
  },
];

export const howItWorksSteps = [
  {
    title: "Add your vehicle and postcode",
    description:
      "Start with your registration or manual vehicle details so the booking flow can match the right service and location.",
  },
  {
    title: "Choose the service",
    description:
      "Review the job, check what is included, and build a fixed total before sharing your contact details.",
  },
  {
    title: "Submit with confidence",
    description:
      "Send the booking once everything looks right, then use the confirmation details while the appointment is arranged.",
  },
];

export const contactDetails = {
  phone: "+447404805919",
  email: "info@stmmotors.com",
  whatsapp: "WhatsApp support available",
  address: "26 Melville Brodie Gardens, Kirkcaldy, KY1 2FN",
  openingHours: "Mon-Sat: 8am - 6pm",
};
