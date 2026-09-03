export type ServicePricingModel = "fixed" | "quote";

export interface ServiceDefinition {
  active: boolean;
  bookingPriceLabel?: string;
  category: string;
  eyebrow: string;
  heroSummary: string;
  id: string;
  image: string;
  importantNotes: string[];
  labourTime: string;
  name: string;
  partsIncluded: string[];
  price: number;
  pricingModel: ServicePricingModel;
  shortDescription: string;
  symptoms: string[];
  whatsIncluded: string[];
  workDetails: string[];
}

export const services: ServiceDefinition[] = [
  {
    id: "brake-pads-front-all",
    name: "Brake pads replacement - front",
    category: "Brake services",
    pricingModel: "fixed",
    price: 75.4,
    active: true,
    eyebrow: "Front axle braking",
    heroSummary:
      "Fixed-price front brake pad replacement carried out at your home or workplace for both front wheels.",
    image: "/images/service-brake-pads-front.png",
    shortDescription:
      "Mobile front brake pad replacement with clear pricing and on-site fitting where suitable.",
    labourTime: "45 to 75 minutes",
    partsIncluded: ["Front brake pads", "Wear sensor if included with the fitting kit"],
    whatsIncluded: [
      "Fixed-price mobile appointment",
      "Replacement front brake pads for both front wheels",
      "Installation labour",
      "Basic inspection of visible front braking components during the appointment",
      "VAT where applicable",
      "Clear confirmation before the work begins",
    ],
    symptoms: [
      "Front brakes are squealing or grinding",
      "Front pads are worn and due for replacement",
      "The brake warning indicator appears",
      "You want a fixed-price mobile brake pad appointment",
    ],
    workDetails: [
      "Remove the front wheels",
      "Remove the worn front brake pads",
      "Fit the replacement front brake pads",
      "Inspect the visible front braking area during the job",
      "Complete final checks before handover",
    ],
    importantNotes: [
      "Brake disc condition may affect whether pad-only replacement is suitable",
      "Vehicle-specific requirements may change the exact fitting procedure",
    ],
  },
  {
    id: "brake-pads-rear-all",
    name: "Brake pads replacement - rear",
    category: "Brake services",
    pricingModel: "fixed",
    price: 74.3,
    active: true,
    eyebrow: "Rear axle braking",
    heroSummary:
      "Fixed-price rear brake pad replacement carried out at your home or workplace for both rear wheels.",
    image: "/images/service-brake-pads-rear.png",
    shortDescription:
      "Mobile rear brake pad replacement with clear pricing and on-site fitting where suitable.",
    labourTime: "45 to 75 minutes",
    partsIncluded: ["Rear brake pads", "Wear sensor if included with the fitting kit"],
    whatsIncluded: [
      "Fixed-price mobile appointment",
      "Replacement rear brake pads for both rear wheels",
      "Installation labour",
      "Basic inspection of visible rear braking components during the appointment",
      "VAT where applicable",
      "Clear confirmation before the work begins",
    ],
    symptoms: [
      "Rear brakes are squealing or grinding",
      "Brake warning indicator appears",
      "Rear pads are worn and due for replacement",
      "You want a fixed-price mobile brake pad appointment",
    ],
    workDetails: [
      "Remove the rear wheels",
      "Remove the worn rear brake pads",
      "Fit the replacement rear brake pads",
      "Inspect the visible rear braking area during the job",
      "Complete final checks before handover",
    ],
    importantNotes: [
      "Brake disc condition may affect whether pad-only replacement is suitable",
      "Vehicle-specific requirements may change the exact fitting procedure",
    ],
  },
  {
    id: "disc-and-pad-replacement-front-all",
    name: "Disc and pad replacement - front",
    category: "Brake services",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Front axle braking",
    heroSummary:
      "Front brake disc and pad replacement where a pad-only repair is no longer the right option.",
    image: "/images/service-disc-pad-front.png",
    shortDescription:
      "Front brake disc and pad replacement for both front wheels, with the final quote confirmed after review.",
    labourTime: "90 to 150 minutes",
    partsIncluded: ["Front brake discs", "Front brake pads"],
    whatsIncluded: [
      "Front axle brake disc and pad inspection",
      "Replacement planning for both front wheels",
      "Clear confirmation before extra parts are ordered or fitted",
    ],
    symptoms: [
      "Front brake discs are scored, lipped, or warped",
      "A front pad-only replacement is no longer suitable",
      "You want the braking setup assessed properly before booking wider repair work",
    ],
    workDetails: [
      "Inspect the front pad and disc condition",
      "Confirm the front axle parts required",
      "Replace the front discs and pads where approved",
      "Carry out final brake checks before handover",
    ],
    importantNotes: [
      "Final pricing depends on vehicle specification and front axle parts requirements",
      "Additional brake hardware may be needed depending on the condition found",
    ],
  },
  {
    id: "disc-and-pad-replacement-rear-all",
    name: "Disc and pad replacement - rear",
    category: "Brake services",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Rear axle braking",
    heroSummary:
      "Rear brake disc and pad replacement where a pad-only repair is no longer the right option.",
    image: "/images/service-disc-pad-rear.png",
    shortDescription:
      "Rear brake disc and pad replacement for both rear wheels, with the final quote confirmed after review.",
    labourTime: "90 to 150 minutes",
    partsIncluded: ["Rear brake discs", "Rear brake pads"],
    whatsIncluded: [
      "Rear axle brake disc and pad inspection",
      "Replacement planning for both rear wheels",
      "Clear confirmation before extra parts are ordered or fitted",
    ],
    symptoms: [
      "Rear brake discs are scored, lipped, or warped",
      "A rear pad-only replacement is no longer suitable",
      "You want the braking setup assessed properly before booking wider repair work",
    ],
    workDetails: [
      "Inspect the rear pad and disc condition",
      "Confirm the rear axle parts required",
      "Replace the rear discs and pads where approved",
      "Carry out final brake checks before handover",
    ],
    importantNotes: [
      "Final pricing depends on vehicle specification and rear axle parts requirements",
      "Additional brake hardware may be needed depending on the condition found",
    ],
  },
  {
    id: "brake-caliper-replacement",
    name: "Brake caliper replacement",
    category: "Brake services",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Brake repair",
    heroSummary:
      "Brake caliper replacement including fluid refill and brake bleed where required.",
    image: "/images/service-brake-caliper.png",
    shortDescription:
      "Mobile brake caliper replacement requested with review-based pricing and proper system bleed support.",
    labourTime: "90 to 180 minutes",
    partsIncluded: ["Replacement caliper where approved", "Fresh brake fluid as required"],
    whatsIncluded: [
      "Brake caliper diagnosis and replacement planning",
      "Fresh fluid refill where required",
      "Bleeding the brake system after the repair",
    ],
    symptoms: [
      "A caliper is seized or sticking",
      "The vehicle pulls under braking",
      "A leak is visible around the caliper area",
    ],
    workDetails: [
      "Inspect the affected caliper and surrounding brake components",
      "Replace the faulty caliper where approved",
      "Refill brake fluid and bleed the system",
      "Check for leaks and safe pedal feel before handover",
    ],
    importantNotes: [
      "Final pricing depends on vehicle specification and the side affected",
      "Related brake components may need extra attention if wear or seizure is found",
    ],
  },
  {
    id: "brake-fluid-replacement",
    name: "Brake fluid replacement",
    category: "Brake services",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Brake maintenance",
    heroSummary:
      "Brake fluid replacement with fresh fluid and proper bleed procedure where needed.",
    image: "/images/service-brake-fluid.png",
    shortDescription:
      "Brake fluid service requested through the booking flow, with final pricing confirmed after vehicle review.",
    labourTime: "45 to 75 minutes",
    partsIncluded: ["Fresh brake fluid matched to the required specification"],
    whatsIncluded: [
      "Brake fluid condition review",
      "Fresh fluid replacement",
      "Brake system bleed where required",
    ],
    symptoms: [
      "Brake fluid service interval is due",
      "Pedal feel is soft or inconsistent",
      "You want brake maintenance handled before braking feel worsens",
    ],
    workDetails: [
      "Inspect brake fluid condition",
      "Replace old fluid with fresh fluid",
      "Bleed the braking system as required",
      "Confirm pedal feel and visible condition before handover",
    ],
    importantNotes: [
      "Some vehicles require specific brake fluid grades or bleeding procedures",
      "Any additional braking faults found are discussed separately before repair work continues",
    ],
  },
  {
    id: "engine-oil-filter-replacement",
    name: "Engine oil & filter replacement",
    category: "Routine servicing",
    pricingModel: "fixed",
    price: 119.29,
    active: true,
    eyebrow: "Routine protection",
    heroSummary:
      "Fresh engine oil and a new filter fitted at your home or workplace with fixed mobile pricing.",
    image: "/images/service-engine-oil-filter.png",
    shortDescription:
      "Mobile engine oil and filter replacement carried out at your home or workplace.",
    labourTime: "30 to 60 minutes",
    partsIncluded: ["Engine oil", "Oil filter", "Drain plug washer if needed"],
    whatsIncluded: [
      "Fixed-price mobile appointment",
      "Fresh engine oil matched to your vehicle requirements",
      "New oil filter",
      "Drain plug washer if required",
      "Labour and VAT where applicable",
      "Basic post-service inspection for leaks and oil level",
    ],
    symptoms: [
      "Routine oil service is due",
      "Oil warning light or service reminder appears",
      "Engine oil looks old or contaminated",
      "You want convenient routine maintenance without visiting a garage",
    ],
    workDetails: [
      "Drain the used engine oil",
      "Replace the oil filter",
      "Refill the engine with fresh oil",
      "Check oil level and inspect for leaks",
      "Confirm the service is complete before handover",
    ],
    importantNotes: [
      "Service details can vary depending on vehicle specification",
      "Additional parts outside the standard service scope would be discussed first",
    ],
  },
  {
    id: "air-filter-replacement",
    name: "Air filter replacement",
    category: "Routine servicing",
    pricingModel: "quote",
    bookingPriceLabel: "Labour priced. Parts quoted separately.",
    price: 0,
    active: true,
    eyebrow: "Routine servicing",
    heroSummary:
      "Air filter replacement to support cleaner airflow and routine service condition.",
    image: "/images/service-air-filter.png",
    shortDescription:
      "Air filter replacement requested through the booking flow, with fitment and price confirmed after review.",
    labourTime: "20 to 40 minutes",
    partsIncluded: ["Replacement engine air filter where approved"],
    whatsIncluded: [
      "Air filter condition check",
      "Replacement fitment where required",
      "Clear maintenance advice before handover",
    ],
    symptoms: [
      "Routine service is due and the air filter needs changing",
      "The current filter is dirty or overdue",
      "You want service items grouped into one visit where suitable",
    ],
    workDetails: [
      "Inspect the current engine air filter",
      "Replace the filter where required",
      "Confirm the housing is refitted correctly",
      "Complete final service checks before handover",
    ],
    importantNotes: [
      "Access and parts vary by vehicle",
      "Final pricing depends on the required filter and vehicle setup",
    ],
  },
  {
    id: "cabin-filter-replacement",
    name: "Cabin filter replacement",
    category: "Routine servicing",
    pricingModel: "quote",
    bookingPriceLabel: "Labour priced. Parts quoted separately.",
    price: 0,
    active: true,
    eyebrow: "Routine servicing",
    heroSummary:
      "Cabin filter replacement to support cleaner airflow through the interior ventilation system.",
    image: "/images/service-cabin-filter.png",
    shortDescription:
      "Cabin filter replacement requested with final fitment and price confirmed after review.",
    labourTime: "20 to 45 minutes",
    partsIncluded: ["Replacement cabin filter where approved"],
    whatsIncluded: [
      "Cabin filter inspection",
      "Replacement fitment where required",
      "A cleaner airflow maintenance visit where suitable",
    ],
    symptoms: [
      "Cabin airflow feels weak or stale",
      "Routine servicing is due",
      "You want common service items handled during one visit",
    ],
    workDetails: [
      "Inspect the current cabin filter",
      "Replace the filter where required",
      "Refit access panels correctly",
      "Confirm the service item is complete before handover",
    ],
    importantNotes: [
      "Filter access varies significantly between vehicles",
      "Some airflow issues may point to separate heating or air conditioning faults",
    ],
  },
  {
    id: "engine-flush",
    name: "Engine flush",
    category: "Routine servicing",
    pricingModel: "quote",
    bookingPriceLabel: "Labour priced. Oil and parts quoted separately.",
    price: 0,
    active: true,
    eyebrow: "Routine servicing",
    heroSummary:
      "Engine flush service combined with an oil change where a deeper maintenance step is suitable.",
    image: "/images/service-engine-flush.png",
    shortDescription:
      "Engine flush requested through the booking flow, with suitability and final price confirmed after review.",
    labourTime: "45 to 90 minutes",
    partsIncluded: ["Engine flush treatment where suitable", "Fresh engine oil", "New oil filter"],
    whatsIncluded: [
      "Service-history and suitability review",
      "Engine flush treatment where appropriate",
      "Oil and filter replacement as part of the same visit",
    ],
    symptoms: [
      "Oil servicing is overdue and a deeper maintenance approach may be needed",
      "You want an engine flush considered before fresh oil is fitted",
      "You have been advised to ask whether flush treatment is suitable",
    ],
    workDetails: [
      "Review whether the engine is suitable for flush treatment",
      "Carry out the engine flush process where approved",
      "Drain used oil and replace the filter",
      "Refill with fresh oil and complete final checks",
    ],
    importantNotes: [
      "Engine flush is only carried out where suitable for the vehicle condition",
      "Vehicle specification and oil requirements affect the final quote",
    ],
  },
  {
    id: "full-service",
    name: "Full service",
    category: "Routine servicing",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Routine servicing",
    heroSummary:
      "A fuller routine service visit covering common maintenance items, routine checks, and top up of serviceable fluids where required.",
    image: "/images/service-full-service.png",
    shortDescription:
      "Full service requested through the booking flow, including common routine service items and top up of serviceable fluids, with the exact scope and price confirmed after review.",
    labourTime: "90 to 180 minutes",
    partsIncluded: [
      "Common service parts matched to the vehicle requirements",
      "Serviceable fluid top-ups where required",
    ],
    whatsIncluded: [
      "A broader routine maintenance visit",
      "Engine oil and filter service where included for the vehicle plan",
      "Air filter and cabin filter checks as part of the service review",
      "Top up of serviceable fluids where required",
      "General under-bonnet and routine maintenance checks",
      "Clear confirmation of the completed service before handover",
    ],
    symptoms: [
      "The vehicle is due a fuller annual or interval-based service",
      "You want more than a basic oil change",
      "You want key maintenance items reviewed together in one visit",
    ],
    workDetails: [
      "Review the vehicle service requirements and history where available",
      "Carry out the common full-service items that apply to the vehicle",
      "Check filters, accessible fluid levels, and general maintenance areas",
      "Check and top up serviceable fluids where required",
      "Review visible condition across routine service areas",
      "Complete final checks and handover",
    ],
    importantNotes: [
      "Serviceable fluid top-ups are included as part of the full service visit",
      "Full service scope still varies by vehicle and service history",
      "Any replacement parts outside the general service plan are confirmed before work starts",
      "Final pricing depends on the service items required for the vehicle",
    ],
  },
  {
    id: "top-up-all-fluids",
    name: "Top up all fluids",
    category: "Routine servicing",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Routine servicing",
    heroSummary:
      "Check and top up serviceable vehicle fluids where required between major maintenance visits.",
    image: "/images/service-full-service.png",
    shortDescription:
      "Fluid top-up service requested through the booking flow, with required fluids and final price confirmed after review.",
    labourTime: "20 to 45 minutes",
    partsIncluded: ["Required fluids where approved"],
    whatsIncluded: [
      "Check the main serviceable fluid levels",
      "Top up suitable fluids where required",
      "Clear advice if a leak or wider issue is suspected",
    ],
    symptoms: [
      "You want fluids checked between scheduled services",
      "A warning light suggests a low serviceable fluid level",
      "You want a simple maintenance visit without a full workshop appointment",
    ],
    workDetails: [
      "Check accessible serviceable fluid levels",
      "Top up required fluids where suitable",
      "Note any visible concerns that need further inspection",
      "Confirm the visit outcome before handover",
    ],
    importantNotes: [
      "Final pricing depends on which fluids are required and in what quantity",
      "If a fluid level is low because of an active fault or leak, further diagnosis may be needed",
    ],
  },
  {
    id: "battery-service",
    name: "Battery service",
    category: "Routine servicing",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Electrical support",
    heroSummary:
      "Battery checks, battery-related diagnosis, and replacement support where the issue points to battery condition or supply.",
    image: "/images/service-battery.png",
    shortDescription:
      "Battery service requested through the booking flow, with diagnosis and final price confirmed after review.",
    labourTime: "30 to 60 minutes",
    partsIncluded: ["Battery-related parts if approved after review"],
    whatsIncluded: [
      "Battery condition and starting checks",
      "Visible terminal and supply review",
      "Battery replacement planning where required",
    ],
    symptoms: [
      "The vehicle is slow to start or not starting reliably",
      "The battery is repeatedly going flat",
      "You want the battery system checked before replacing parts unnecessarily",
    ],
    workDetails: [
      "Assess battery condition and obvious supply issues",
      "Inspect visible terminals and connections",
      "Recommend replacement or further electrical checks if required",
      "Confirm the next step before handover",
    ],
    importantNotes: [
      "Some faults can involve charging or wider electrical issues, not just the battery itself",
      "Final pricing depends on diagnosis, battery specification, and any replacement required",
    ],
  },
  {
    id: "heating-repair",
    name: "Heating repair",
    category: "Comfort and chassis",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Cabin heating",
    heroSummary:
      "Cabin heating checks, fault tracing, and suitable repair support for heating and airflow issues.",
    image: "/images/service-heating-aircon.png",
    shortDescription:
      "Heating repair requested through the booking flow, with diagnosis and final price confirmed after review.",
    labourTime: "45 to 90 minutes",
    partsIncluded: ["Parts matched to the confirmed repair path where approved"],
    whatsIncluded: [
      "Heating and airflow performance checks",
      "Heating fault tracing where suitable",
      "Clear advice on the likely repair path",
    ],
    symptoms: [
      "Cabin heating or blower performance is inconsistent",
      "The cabin is not warming up properly",
      "You want the issue assessed before committing to unnecessary parts",
    ],
    workDetails: [
      "Assess heating and airflow behaviour",
      "Trace likely cabin-heating faults",
      "Recommend the appropriate repair path",
      "Confirm the next step before handover",
    ],
    importantNotes: [
      "Some heating faults require wider cooling-system or electrical diagnosis",
      "Final pricing depends on the diagnosis and repair path required",
    ],
  },
  {
    id: "air-conditioning-repair",
    name: "Air conditioning repair",
    category: "Comfort and chassis",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Cabin cooling",
    heroSummary:
      "Air conditioning checks, fault tracing, and suitable repair support for cabin cooling issues.",
    image: "/images/service-heating-aircon.png",
    shortDescription:
      "Air conditioning repair requested through the booking flow, with diagnosis and final price confirmed after review.",
    labourTime: "45 to 90 minutes",
    partsIncluded: ["Parts matched to the confirmed repair path where approved"],
    whatsIncluded: [
      "Air conditioning performance checks",
      "Air conditioning fault tracing where suitable",
      "Clear advice on the likely repair path",
    ],
    symptoms: [
      "The air conditioning is no longer cooling properly",
      "Cooling or airflow performance is inconsistent",
      "You want the issue assessed before committing to unnecessary parts",
    ],
    workDetails: [
      "Assess cooling and airflow behaviour",
      "Trace likely air conditioning faults",
      "Recommend the appropriate repair path",
      "Confirm the next step before handover",
    ],
    importantNotes: [
      "Some air conditioning faults require specialist follow-on support",
      "Final pricing depends on the diagnosis and repair path required",
    ],
  },
  {
    id: "engine-diagnostic-service",
    name: "Engine diagnostic service",
    category: "Routine servicing",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Diagnostics",
    heroSummary:
      "Engine diagnostics to investigate warning lights, running issues, and uncertain performance problems.",
    image: "/images/service-engine-diagnostic.png",
    shortDescription:
      "Engine diagnostic service requested through the booking flow, with fault tracing and final price confirmed after review.",
    labourTime: "45 to 90 minutes",
    partsIncluded: ["Diagnostic time and review"],
    whatsIncluded: [
      "Engine fault-code checks where supported",
      "Symptom-led assessment",
      "Clear next-step guidance after diagnosis",
    ],
    symptoms: [
      "An engine warning light has appeared",
      "The vehicle is misfiring, hesitating, or running poorly",
      "You want the issue diagnosed before approving wider repair work",
    ],
    workDetails: [
      "Scan and review engine fault information where supported",
      "Assess the reported symptoms in context",
      "Identify likely causes and next steps",
      "Confirm diagnostic findings before handover",
    ],
    importantNotes: [
      "Some faults need staged diagnosis and may not be fully resolved in one visit",
      "The diagnostic appointment is designed to identify the issue, not automatically include all resulting repairs",
    ],
  },
  {
    id: "suspension-repairs",
    name: "Suspension repairs",
    category: "Comfort and chassis",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Ride and suspension",
    heroSummary:
      "Suspension checks with suitable repair support for knocks, unwanted movement, and ride concerns.",
    image: "/images/service-suspension-steering.png",
    shortDescription:
      "Suspension repairs requested through the booking flow, with diagnosis and final price confirmed after review.",
    labourTime: "60 to 150 minutes",
    partsIncluded: ["Parts matched to the confirmed repair path where approved"],
    whatsIncluded: [
      "Suspension and ride concern assessment",
      "Inspection of likely wear areas where accessible",
      "Clear repair guidance before work is approved",
    ],
    symptoms: [
      "You can hear knocks, clunks, or unwanted movement over bumps",
      "The ride feels uneven or unstable",
      "The vehicle is not handling bumps as it should",
    ],
    workDetails: [
      "Assess suspension symptoms",
      "Inspect likely suspension wear components where accessible",
      "Confirm the required repair path",
      "Carry out approved repair work and final checks",
    ],
    importantNotes: [
      "Final pricing depends on which components are involved",
      "Some repairs may require follow-on wheel alignment or additional workshop support",
    ],
  },
  {
    id: "steering-system-repairs",
    name: "Steering system repairs",
    category: "Comfort and chassis",
    pricingModel: "quote",
    price: 0,
    active: true,
    eyebrow: "Steering and handling",
    heroSummary:
      "Steering system checks with suitable repair support for looseness, uneven response, and handling concerns.",
    image: "/images/service-suspension-steering.png",
    shortDescription:
      "Steering system repairs requested through the booking flow, with diagnosis and final price confirmed after review.",
    labourTime: "60 to 150 minutes",
    partsIncluded: ["Parts matched to the confirmed repair path where approved"],
    whatsIncluded: [
      "Steering and handling concern assessment",
      "Inspection of likely wear areas where accessible",
      "Clear repair guidance before work is approved",
    ],
    symptoms: [
      "The steering feels loose, uneven, or no longer confidence-inspiring",
      "The vehicle is pulling or wandering",
      "Steering response or assistance does not feel as it should",
    ],
    workDetails: [
      "Assess steering symptoms",
      "Inspect likely steering components where accessible",
      "Confirm the required repair path",
      "Carry out approved repair work and final checks",
    ],
    importantNotes: [
      "Final pricing depends on which components are involved",
      "Some repairs may require follow-on wheel alignment or additional workshop support",
    ],
  },
];

const serviceById = new Map(services.map((service) => [service.id, service]));

export interface ServicePricingSummary {
  displayLabel: string;
  fixedTotal: number;
  hasFixedPriceServices: boolean;
  hasQuoteServices: boolean;
  helperText: string;
}

export interface BookingServiceOptionGroup {
  description?: string;
  id: string;
  optionIds: string[];
  title: string;
}

export interface BookingServiceSection {
  description?: string;
  groups: BookingServiceOptionGroup[];
  id: string;
  title: string;
}

export const bookingServiceSections: BookingServiceSection[] = [
  {
    id: "brake-services",
    title: "Brake services",
    groups: [
      {
        id: "brake-services-options",
        title: "Brake services",
        optionIds: [
          "brake-pads-front-all",
          "brake-pads-rear-all",
          "disc-and-pad-replacement-front-all",
          "disc-and-pad-replacement-rear-all",
          "brake-caliper-replacement",
          "brake-fluid-replacement",
        ],
      },
    ],
  },
  {
    id: "routine-servicing",
    title: "Routine servicing",
    groups: [
      {
        id: "routine-servicing-options",
        title: "Routine servicing",
        optionIds: [
          "engine-oil-filter-replacement",
          "air-filter-replacement",
          "cabin-filter-replacement",
          "engine-flush",
          "full-service",
          "top-up-all-fluids",
          "battery-service",
          "engine-diagnostic-service",
        ],
      },
    ],
  },
  {
    id: "comfort-chassis",
    title: "Comfort and chassis",
    groups: [
      {
        id: "comfort-chassis-options",
        title: "Comfort and chassis",
        optionIds: [
          "heating-repair",
          "air-conditioning-repair",
          "suspension-repairs",
          "steering-system-repairs",
        ],
      },
    ],
  },
];

export function getServiceById(serviceId: string): ServiceDefinition | null {
  return serviceById.get(serviceId) ?? null;
}

export function getServicesByIds(serviceIds: string[]): ServiceDefinition[] {
  return serviceIds
    .map((serviceId) => getServiceById(serviceId))
    .filter((service): service is ServiceDefinition => Boolean(service));
}

export function formatServicePrice(price: number): string {
  return `\u00A3${price.toFixed(2)}`;
}

export function formatServicePriceLabel(service: ServiceDefinition): string {
  if (service.bookingPriceLabel) {
    return service.bookingPriceLabel;
  }

  return service.pricingModel === "fixed"
    ? formatServicePrice(service.price)
    : "Quote to confirm";
}

export function getServicePricingSummary(
  serviceIds: string[],
  fixedTotalOverride?: number,
): ServicePricingSummary {
  const selectedServices = getServicesByIds(serviceIds);
  const hasLabourPricedServices = selectedServices.some((service) =>
    (service.bookingPriceLabel ?? "").toLowerCase().includes("labour"),
  );
  const hasQuoteServices = selectedServices.some(
    (service) => service.pricingModel === "quote",
  );
  const computedFixedTotal = Number(
    selectedServices
      .filter((service) => service.pricingModel === "fixed")
      .reduce((total, service) => total + service.price, 0)
      .toFixed(2),
  );
  const fixedTotal =
    typeof fixedTotalOverride === "number"
      ? Number(fixedTotalOverride.toFixed(2))
      : computedFixedTotal;
  const hasFixedPriceServices = fixedTotal > 0;

  if (hasFixedPriceServices && hasQuoteServices) {
    return {
      displayLabel: `${formatServicePrice(fixedTotal)} + quote`,
      fixedTotal,
      hasFixedPriceServices: true,
      hasQuoteServices: true,
      helperText:
        hasLabourPricedServices
          ? "Fixed-price items are shown now. Labour-priced services and any required parts or oil are confirmed after review."
          : "Fixed-price items are shown now. Additional quoted work will be confirmed after review.",
    };
  }

  if (hasQuoteServices) {
    return {
      displayLabel: "Quote to confirm",
      fixedTotal,
      hasFixedPriceServices: false,
      hasQuoteServices: true,
      helperText:
        hasLabourPricedServices
          ? "Labour-priced services and any required parts or oil will be confirmed after STM Motors reviews the selected service request."
          : "Final pricing will be confirmed after STM Motors reviews the selected service request.",
    };
  }

  return {
    displayLabel: hasFixedPriceServices ? formatServicePrice(fixedTotal) : "\u2014",
    fixedTotal,
    hasFixedPriceServices,
    hasQuoteServices: false,
    helperText: hasFixedPriceServices
      ? "Pricing and labour time shown for selected services."
      : "Select a service to view pricing and time.",
  };
}
