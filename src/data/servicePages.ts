export const BRAKE_PADS_FRONT_ROUTE = "/services/brake-pads-front";
export const BRAKE_PADS_REAR_ROUTE = "/services/brake-pads-rear";
export const DISC_AND_PAD_REPLACEMENT_FRONT_ROUTE =
  "/services/disc-and-pad-replacement-front";
export const DISC_AND_PAD_REPLACEMENT_REAR_ROUTE =
  "/services/disc-and-pad-replacement-rear";
export const BRAKE_CALIPER_REPLACEMENT_ROUTE =
  "/services/brake-caliper-replacement";
export const BRAKE_FLUID_REPLACEMENT_ROUTE =
  "/services/brake-fluid-replacement";
export const ENGINE_OIL_FILTER_REPLACEMENT_ROUTE =
  "/services/engine-oil-filter-replacement";
export const AIR_FILTER_REPLACEMENT_ROUTE = "/services/air-filter-replacement";
export const CABIN_FILTER_REPLACEMENT_ROUTE =
  "/services/cabin-filter-replacement";
export const ENGINE_FLUSH_ROUTE = "/services/engine-flush";
export const FULL_SERVICE_ROUTE = "/services/full-service";
export const TOP_UP_ALL_FLUIDS_ROUTE = "/services/top-up-all-fluids";
export const BATTERY_SERVICE_ROUTE = "/services/battery-service";
export const HEATING_AIR_CONDITIONING_ROUTE =
  "/services/heating-air-conditioning";
export const ENGINE_DIAGNOSTIC_SERVICE_ROUTE =
  "/services/engine-diagnostic-service";
export const SUSPENSION_AND_STEERING_ROUTE =
  "/services/suspension-and-steering-system-repairs";

export interface ServicePageDefinition {
  bookableOnline: boolean;
  category: string;
  description: string;
  eyebrow: string;
  href: string;
  id: string;
  image: string;
  importantNotes: string[];
  priceLabel: string;
  reasonsToBook: string[];
  services: Array<{
    description: string;
    title: string;
  }>;
  shortDescription: string;
  title: string;
}

export interface ServiceCategoryDefinition {
  description: string;
  id: string;
  serviceIds: string[];
  title: string;
}

export const brakePadsFrontPage: ServicePageDefinition = {
  id: "brake-pads-front",
  title: "Brake pads replacement - front",
  eyebrow: "Brake service",
  category: "Brake services",
  href: BRAKE_PADS_FRONT_ROUTE,
  image: "/images/service-brake-pads-front.png",
  priceLabel: "\u00A375.40",
  shortDescription:
    "Fixed-price mobile front brake pad replacement carried out at your home or workplace for both front wheels.",
  description:
    "STM Motors carries out front brake pad replacement at your location with clear fixed pricing, sensible checks, and a professional mobile fitting visit where the job is suitable on-site.",
  bookableOnline: true,
  services: [
    {
      title: "Front pad replacement",
      description:
        "Replacement brake pads are fitted for both front wheels during the mobile appointment.",
    },
    {
      title: "Visible brake inspection",
      description:
        "The accessible front braking area is checked during the visit before final handover.",
    },
    {
      title: "Clear completion check",
      description:
        "The work carried out is confirmed clearly before the appointment is signed off.",
    },
  ],
  reasonsToBook: [
    "Front brakes are squealing, grinding, or losing confidence under braking",
    "A service check has flagged worn front pads",
    "You want a simpler mobile replacement without arranging a garage visit",
  ],
  importantNotes: [
    "Brake disc condition can affect whether a pad-only replacement is suitable",
    "Any additional parts outside the standard scope are confirmed before work starts",
  ],
};

export const brakePadsRearPage: ServicePageDefinition = {
  id: "brake-pads-rear",
  title: "Brake pads replacement - rear",
  eyebrow: "Brake service",
  category: "Brake services",
  href: BRAKE_PADS_REAR_ROUTE,
  image: "/images/service-brake-pads-rear.png",
  priceLabel: "\u00A374.30",
  shortDescription:
    "Fixed-price mobile rear brake pad replacement carried out at your home or workplace for both rear wheels.",
  description:
    "Rear brake pad replacement is handled as a straightforward mobile visit with clear fixed pricing, sensible checks, and fitting at home or work where suitable.",
  bookableOnline: true,
  services: [
    {
      title: "Rear pad replacement",
      description:
        "Replacement brake pads are fitted for both rear wheels during the appointment.",
    },
    {
      title: "Visible brake inspection",
      description:
        "The accessible rear braking area is checked during the visit before handover.",
    },
    {
      title: "Clear completion check",
      description:
        "The work completed is confirmed clearly before the appointment is closed.",
    },
  ],
  reasonsToBook: [
    "Rear brakes are squealing, grinding, or close to their wear limit",
    "A warning light or service inspection has highlighted worn rear pads",
    "You want a mobile replacement booked around your day",
  ],
  importantNotes: [
    "Brake disc condition can affect whether a pad-only replacement is suitable",
    "Some vehicles require additional electronic brake procedures during rear pad work",
  ],
};

export const discAndPadReplacementFrontPage: ServicePageDefinition = {
  id: "disc-and-pad-replacement-front",
  title: "Disc and pad replacement - front",
  eyebrow: "Front axle braking",
  category: "Brake services",
  href: DISC_AND_PAD_REPLACEMENT_FRONT_ROUTE,
  image: "/images/service-disc-pad-front.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Front brake disc and pad replacement for worn or damaged braking components where a pad-only repair is no longer the right option.",
  description:
    "When the front discs and pads both need replacing, STM Motors can assess the vehicle and carry out suitable axle-based brake repairs with clear advice on parts, fitment, and next steps.",
  bookableOnline: true,
  services: [
    {
      title: "Front disc and pad fitment",
      description:
        "Worn front pads and brake discs are replaced together when the condition of the front braking system calls for a fuller repair.",
    },
    {
      title: "Front brake wear assessment",
      description:
        "Visible front brake wear, scoring, lip build-up, and overall suitability are checked before the repair plan is confirmed.",
    },
    {
      title: "Post-fit confirmation",
      description:
        "The work carried out is checked and explained clearly before handover.",
    },
  ],
  reasonsToBook: [
    "Front brake discs are scored, lipped, warped, or below the required condition",
    "A front pad-only replacement is no longer suitable for the axle",
    "You are feeling vibration or uneven front braking and need the setup assessed properly",
  ],
  importantNotes: [
    "Final pricing depends on the front axle involved, vehicle specification, and parts required",
    "If other braking components are seized or damaged, those items are discussed separately before work continues",
  ],
};

export const discAndPadReplacementRearPage: ServicePageDefinition = {
  id: "disc-and-pad-replacement-rear",
  title: "Disc and pad replacement - rear",
  eyebrow: "Rear axle braking",
  category: "Brake services",
  href: DISC_AND_PAD_REPLACEMENT_REAR_ROUTE,
  image: "/images/service-disc-pad-rear.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Rear brake disc and pad replacement for worn or damaged braking components where a pad-only repair is no longer the right option.",
  description:
    "When the rear discs and pads both need replacing, STM Motors can assess the vehicle and carry out suitable axle-based brake repairs with clear advice on parts, fitment, and next steps.",
  bookableOnline: true,
  services: [
    {
      title: "Rear disc and pad fitment",
      description:
        "Worn rear pads and brake discs are replaced together when the condition of the rear braking system calls for a fuller repair.",
    },
    {
      title: "Rear brake wear assessment",
      description:
        "Visible rear brake wear, scoring, lip build-up, and overall suitability are checked before the repair plan is confirmed.",
    },
    {
      title: "Post-fit confirmation",
      description:
        "The work carried out is checked and explained clearly before handover.",
    },
  ],
  reasonsToBook: [
    "Rear brake discs are scored, lipped, warped, or below the required condition",
    "A rear pad-only replacement is no longer suitable for the axle",
    "You are feeling uneven rear braking and need the setup assessed properly",
  ],
  importantNotes: [
    "Final pricing depends on the rear axle involved, vehicle specification, and parts required",
    "If other braking components are seized or damaged, those items are discussed separately before work continues",
  ],
};

export const brakeCaliperReplacementPage: ServicePageDefinition = {
  id: "brake-caliper-replacement",
  title: "Brake caliper replacement",
  eyebrow: "Brake repair",
  category: "Brake services",
  href: BRAKE_CALIPER_REPLACEMENT_ROUTE,
  image: "/images/service-brake-caliper.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Brake caliper replacement including draining the brake fluid, refilling fresh fluid, and bleeding the system where required.",
  description:
    "STM Motors can diagnose and replace faulty brake calipers, then refill the system with fresh brake fluid and bleed the brakes properly so the repair is completed to a safe service standard.",
  bookableOnline: true,
  services: [
    {
      title: "Caliper replacement",
      description:
        "The faulty brake caliper is removed and the replacement unit is fitted where suitable.",
    },
    {
      title: "Fresh fluid refill and bleed",
      description:
        "Brake fluid is drained as required, fresh fluid is added, and the brake system is bled after the repair.",
    },
    {
      title: "Leak and function checks",
      description:
        "The braking system is checked for visible leaks and proper pedal feel before handover.",
    },
  ],
  reasonsToBook: [
    "A caliper is seized, sticking, or causing uneven braking",
    "The vehicle is pulling under braking or one wheel is running hotter than expected",
    "Brake fluid is leaking from the caliper area",
  ],
  importantNotes: [
    "Final pricing depends on axle position, parts specification, and any related hardware required",
    "If additional hose, carrier, or braking components need attention, they are confirmed before the work proceeds",
  ],
};

export const brakeFluidReplacementPage: ServicePageDefinition = {
  id: "brake-fluid-replacement",
  title: "Brake fluid replacement",
  eyebrow: "Brake maintenance",
  category: "Brake services",
  href: BRAKE_FLUID_REPLACEMENT_ROUTE,
  image: "/images/service-brake-fluid.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Brake fluid replacement with fresh fluid introduced to the system and the brakes bled where needed.",
  description:
    "Brake fluid condition matters for safe braking performance. STM Motors can replace old brake fluid, refill the system with the correct specification, and bleed the setup properly as part of the service.",
  bookableOnline: true,
  services: [
    {
      title: "Old fluid replacement",
      description:
        "Aged or contaminated brake fluid is removed and replaced with fresh fluid matched to the vehicle requirements.",
    },
    {
      title: "Brake bleed procedure",
      description:
        "The system is bled so the refreshed fluid reaches the braking circuit properly.",
    },
    {
      title: "Service confirmation",
      description:
        "Pedal feel and visible system condition are checked before handover.",
    },
  ],
  reasonsToBook: [
    "Brake fluid service intervals are due",
    "Brake pedal feel is soft or inconsistent",
    "You want brake maintenance handled before fluid condition starts affecting braking confidence",
  ],
  importantNotes: [
    "Some vehicles need specific fluid grades or vehicle-specific bleeding procedures",
    "Any unrelated braking faults identified during the visit are discussed separately",
  ],
};

export const engineOilFilterReplacementPage: ServicePageDefinition = {
  id: "engine-oil-filter-replacement",
  title: "Engine oil and filter",
  eyebrow: "Routine servicing",
  category: "Routine servicing",
  href: ENGINE_OIL_FILTER_REPLACEMENT_ROUTE,
  image: "/images/service-engine-oil-filter.png",
  priceLabel: "\u00A3119.29",
  shortDescription:
    "Fresh engine oil and a new oil filter fitted at your home or workplace with clear mobile pricing.",
  description:
    "Engine oil and filter replacement is one of the simplest ways to protect the engine and stay on top of routine maintenance. STM Motors carries it out as a focused mobile visit with fresh oil, a new filter, and final checks before handover.",
  bookableOnline: true,
  services: [
    {
      title: "Fresh engine oil",
      description:
        "Used oil is drained and replaced with fresh oil matched to the vehicle requirements.",
    },
    {
      title: "New oil filter",
      description:
        "A replacement oil filter is fitted as part of the same mobile visit.",
    },
    {
      title: "Final checks",
      description:
        "Oil level and visible leak checks are completed before the vehicle is handed back.",
    },
  ],
  reasonsToBook: [
    "Routine maintenance is due",
    "A service reminder or oil warning has appeared",
    "You want a straightforward oil service without visiting a garage",
  ],
  importantNotes: [
    "Vehicle specification affects the exact oil grade and parts required",
    "Any extra items outside the standard oil and filter scope are discussed before work starts",
  ],
};

export const airFilterReplacementPage: ServicePageDefinition = {
  id: "air-filter-replacement",
  title: "Air filter replacement",
  eyebrow: "Routine servicing",
  category: "Routine servicing",
  href: AIR_FILTER_REPLACEMENT_ROUTE,
  image: "/images/service-air-filter.png",
  priceLabel: "Labour priced, parts quoted separately",
  shortDescription:
    "Engine air filter replacement to help maintain clean airflow and routine service condition.",
  description:
    "A blocked or overdue engine air filter can affect how efficiently the vehicle breathes. STM Motors can inspect and replace the air filter as part of routine maintenance where the job is suitable on-site.",
  bookableOnline: true,
  services: [
    {
      title: "Air filter inspection",
      description:
        "The existing engine air filter is checked for condition, contamination, and suitability for replacement.",
    },
    {
      title: "Replacement fitment",
      description:
        "A replacement air filter is fitted where required to restore clean intake filtration.",
    },
    {
      title: "Routine service support",
      description:
        "The work is carried out cleanly as part of ongoing routine maintenance planning.",
    },
  ],
  reasonsToBook: [
    "Routine maintenance is due and the air filter needs replacing",
    "The existing filter is dirty, blocked, or visibly overdue",
    "You want servicing items handled together during a mobile visit",
  ],
  importantNotes: [
    "Parts and access vary by vehicle design",
    "If the filter housing or related intake components need extra attention, this is confirmed during the visit",
  ],
};

export const cabinFilterReplacementPage: ServicePageDefinition = {
  id: "cabin-filter-replacement",
  title: "Cabin filter replacement",
  eyebrow: "Routine servicing",
  category: "Routine servicing",
  href: CABIN_FILTER_REPLACEMENT_ROUTE,
  image: "/images/service-cabin-filter.png",
  priceLabel: "Labour priced, parts quoted separately",
  shortDescription:
    "Cabin filter replacement to support cleaner airflow through the interior ventilation system.",
  description:
    "Cabin filters help manage dust, pollen, and general debris moving through the interior ventilation system. STM Motors can inspect and replace the cabin filter as part of routine maintenance where suitable.",
  bookableOnline: true,
  services: [
    {
      title: "Cabin filter check",
      description:
        "The condition of the current cabin filter is reviewed before replacement is confirmed.",
    },
    {
      title: "Replacement fitment",
      description:
        "A suitable replacement cabin filter is fitted to support cleaner airflow through the vehicle interior.",
    },
    {
      title: "Ventilation support",
      description:
        "The service helps maintain routine ventilation and interior comfort standards.",
    },
  ],
  reasonsToBook: [
    "Interior airflow has reduced or feels stale",
    "Routine servicing is due and the cabin filter needs replacing",
    "You want common maintenance items completed during one visit",
  ],
  importantNotes: [
    "Filter access varies significantly between vehicles",
    "Some symptoms may point to separate heating or air conditioning faults that need further diagnosis",
  ],
};

export const engineFlushPage: ServicePageDefinition = {
  id: "engine-flush",
  title: "Engine flush",
  eyebrow: "Routine servicing",
  category: "Routine servicing",
  href: ENGINE_FLUSH_ROUTE,
  image: "/images/service-engine-flush.png",
  priceLabel: "Labour priced, oil and parts quoted separately",
  shortDescription:
    "Engine flush service combined with an oil change to help clean the lubrication system before fresh oil is fitted.",
  description:
    "STM Motors offers engine flush servicing for suitable vehicles where a deeper oil-service approach is needed. The service is carried out alongside an oil change so the lubrication system is refreshed before final fill and checks.",
  bookableOnline: true,
  services: [
    {
      title: "Flush treatment process",
      description:
        "An engine flush treatment is used as part of the service plan where suitable for the vehicle condition.",
    },
    {
      title: "Oil and filter refresh",
      description:
        "Used oil is removed, the system is refreshed, and fresh oil with a new filter is fitted as part of the visit.",
    },
    {
      title: "Final oil-level checks",
      description:
        "The engine is checked after the service so the final fill and condition can be confirmed.",
    },
  ],
  reasonsToBook: [
    "The engine has overdue oil history and needs a more considered service visit",
    "You want oil service work paired with a system-cleaning step where suitable",
    "You have been advised to consider an engine flush before fresh oil is fitted",
  ],
  importantNotes: [
    "Engine flush is only used where it is appropriate for the vehicle condition and service history",
    "Vehicle specification and oil requirements affect the final quote and exact process",
  ],
};

export const fullServicePage: ServicePageDefinition = {
  id: "full-service",
  title: "Full service",
  eyebrow: "Routine servicing",
  category: "Routine servicing",
  href: FULL_SERVICE_ROUTE,
  image: "/images/service-full-service.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "A fuller routine service visit covering common maintenance items, routine checks, and top up of serviceable fluids where required.",
  description:
    "STM Motors can carry out full service work for suitable vehicles, covering the general service items that commonly make sense for the appointment. Serviceable fluid top-ups are included as part of the full service visit where required, while vehicle-specific parts and exact scope are confirmed before work goes ahead.",
  bookableOnline: true,
  services: [
    {
      title: "Engine oil and filter service",
      description:
        "Fresh oil and a new filter are included where they form part of the full service plan for the vehicle.",
    },
    {
      title: "Air and cabin filter checks",
      description:
        "Accessible filters are reviewed as part of the service, with replacement discussed where required.",
    },
    {
      title: "Top up all fluids",
      description:
        "Serviceable fluids are checked and topped up where required as part of the full service visit.",
    },
    {
      title: "Routine maintenance checks",
      description:
        "Key under-bonnet and general routine service areas are reviewed as part of the appointment.",
    },
  ],
  reasonsToBook: [
    "The vehicle is due a fuller annual or interval-based service",
    "You want more than a basic oil change",
    "You want several routine service items and fluid top-ups handled in one visit",
  ],
  importantNotes: [
    "Serviceable fluid top-ups are included as part of the full service visit",
    "Full service scope still varies by vehicle and service history",
    "Any replacement parts outside the general service plan are confirmed before work starts",
    "Final pricing depends on the specific parts and maintenance items required",
  ],
};

export const batteryServicePage: ServicePageDefinition = {
  id: "battery-service",
  title: "Battery service",
  eyebrow: "Electrical support",
  category: "Routine servicing",
  href: BATTERY_SERVICE_ROUTE,
  image: "/images/service-battery.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Battery checks, battery-related diagnosis, and replacement support where the issue points to battery condition or supply.",
  description:
    "Battery problems often show up as slow starts, intermittent power issues, or repeated non-start faults. STM Motors can inspect battery condition, check the surrounding setup, and carry out suitable battery service work at your location.",
  bookableOnline: true,
  services: [
    {
      title: "Battery condition check",
      description:
        "The battery is assessed for obvious condition, starting performance, and general serviceability.",
    },
    {
      title: "Terminal and supply checks",
      description:
        "Visible terminal condition and related battery connections are reviewed during the appointment.",
    },
    {
      title: "Replacement support",
      description:
        "Where the battery itself is the issue, suitable replacement work can be discussed and arranged.",
    },
  ],
  reasonsToBook: [
    "The vehicle is slow to start or not starting reliably",
    "Battery warning signs or repeated flat-battery issues are appearing",
    "You want the battery and related setup checked before replacing parts unnecessarily",
  ],
  importantNotes: [
    "Some battery faults can also involve alternator, charging, or electrical system issues",
    "Final pricing depends on diagnosis, battery specification, and any required replacement parts",
  ],
};

export const heatingAirConditioningPage: ServicePageDefinition = {
  id: "heating-air-conditioning",
  title: "Heating and air conditioning",
  eyebrow: "Comfort systems",
  category: "Comfort and chassis",
  href: HEATING_AIR_CONDITIONING_ROUTE,
  image: "/images/service-heating-aircon.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Heating and air conditioning checks, fault tracing, and suitable repair support for cabin comfort issues.",
  description:
    "If the vehicle is not heating, cooling, or circulating air properly, STM Motors can inspect the likely cause and advise on suitable heating and air conditioning service work where mobile diagnosis or repair is appropriate.",
  bookableOnline: true,
  services: [
    {
      title: "System performance checks",
      description:
        "Cabin airflow, heating response, and air conditioning behaviour are checked during diagnosis.",
    },
    {
      title: "Fault tracing",
      description:
        "Likely causes are narrowed down so you get clearer guidance on the next repair step.",
    },
    {
      title: "Repair planning",
      description:
        "Where suitable, STM Motors can advise on the repair path or follow-on work required.",
    },
  ],
  reasonsToBook: [
    "The air conditioning is no longer cooling properly",
    "Cabin heating, airflow, or fan behaviour is inconsistent",
    "You want the issue assessed before committing to unnecessary parts",
  ],
  importantNotes: [
    "Some air conditioning faults may require specialist equipment or follow-on workshop support",
    "Final pricing depends on diagnosis, system condition, and the repair path required",
  ],
};

export const engineDiagnosticServicePage: ServicePageDefinition = {
  id: "engine-diagnostic-service",
  title: "Engine diagnostic service",
  eyebrow: "Diagnostics",
  category: "Routine servicing",
  href: ENGINE_DIAGNOSTIC_SERVICE_ROUTE,
  image: "/images/service-engine-diagnostic.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Engine diagnostics to investigate warning lights, running issues, fault codes, and uncertain performance problems.",
  description:
    "STM Motors can carry out engine diagnostic work to help pinpoint faults more clearly before repair decisions are made. The aim is straightforward diagnosis, sensible advice, and a clearer repair path based on what the vehicle is actually doing.",
  bookableOnline: true,
  services: [
    {
      title: "Fault code scan",
      description:
        "Stored fault information is checked as part of the diagnostic process where supported.",
    },
    {
      title: "Symptom-led assessment",
      description:
        "The engine issue is reviewed in context so the diagnostic result makes practical sense.",
    },
    {
      title: "Next-step guidance",
      description:
        "You get clearer advice on whether repair, further testing, or another service is the sensible next step.",
    },
  ],
  reasonsToBook: [
    "An engine warning light has appeared",
    "The vehicle is misfiring, hesitating, or running poorly",
    "You want the fault diagnosed before agreeing to wider repair work",
  ],
  importantNotes: [
    "Some faults need staged diagnosis and may not be fully resolved in one visit",
    "The diagnostic appointment is designed to identify the issue, not automatically include all resulting repairs",
  ],
};

export const suspensionAndSteeringPage: ServicePageDefinition = {
  id: "suspension-and-steering-system-repairs",
  title: "Suspension and steering system repairs",
  eyebrow: "Ride and handling",
  category: "Comfort and chassis",
  href: SUSPENSION_AND_STEERING_ROUTE,
  image: "/images/service-suspension-steering.png",
  priceLabel: "Quoted after inspection",
  shortDescription:
    "Suspension and steering checks with suitable repair support for knocks, looseness, and handling concerns.",
  description:
    "If the vehicle feels unstable, knocks over bumps, pulls unevenly, or no longer feels right through the steering, STM Motors can assess the likely cause and advise on suitable suspension or steering repair work.",
  bookableOnline: true,
  services: [
    {
      title: "Handling and noise assessment",
      description:
        "Ride quality, steering feel, and obvious suspension-related concerns are reviewed during inspection.",
    },
    {
      title: "Component checks",
      description:
        "Likely wear areas are inspected where accessible so the repair path is clearer.",
    },
    {
      title: "Repair guidance",
      description:
        "You get practical advice on what needs attention and what can wait.",
    },
  ],
  reasonsToBook: [
    "You can hear knocks, clunks, or unwanted movement over bumps",
    "The steering feels loose, uneven, or no longer confidence-inspiring",
    "The vehicle is pulling, wandering, or not handling as it should",
  ],
  importantNotes: [
    "Final pricing depends on which components are involved and how far the repair needs to go",
    "Certain steering and suspension repairs may need wheel alignment or follow-on checks after parts replacement",
  ],
};

export const servicePages: ServicePageDefinition[] = [
  brakePadsFrontPage,
  brakePadsRearPage,
  discAndPadReplacementFrontPage,
  discAndPadReplacementRearPage,
  brakeCaliperReplacementPage,
  brakeFluidReplacementPage,
  engineOilFilterReplacementPage,
  airFilterReplacementPage,
  cabinFilterReplacementPage,
  engineFlushPage,
  fullServicePage,
  batteryServicePage,
  heatingAirConditioningPage,
  engineDiagnosticServicePage,
  suspensionAndSteeringPage,
];

export const serviceCategories: ServiceCategoryDefinition[] = [
  {
    id: "brake-services",
    title: "Brake services",
    description:
      "Mobile brake work covering routine pad replacement through to more involved braking repairs and fluid service support.",
    serviceIds: [
      brakePadsFrontPage.id,
      brakePadsRearPage.id,
      discAndPadReplacementFrontPage.id,
      discAndPadReplacementRearPage.id,
      brakeCaliperReplacementPage.id,
      brakeFluidReplacementPage.id,
    ],
  },
  {
    id: "routine-servicing",
    title: "Routine servicing",
    description:
      "Core maintenance work to help protect the engine, support airflow, handle battery-related checks, and keep everyday servicing simpler to manage.",
    serviceIds: [
      engineOilFilterReplacementPage.id,
      airFilterReplacementPage.id,
      cabinFilterReplacementPage.id,
      engineFlushPage.id,
      fullServicePage.id,
      batteryServicePage.id,
      engineDiagnosticServicePage.id,
    ],
  },
  {
    id: "comfort-chassis",
    title: "Comfort and chassis",
    description:
      "Heating, air conditioning, suspension, and steering support for comfort, control, and day-to-day drivability.",
    serviceIds: [
      heatingAirConditioningPage.id,
      suspensionAndSteeringPage.id,
    ],
  },
];

const servicePageByHref = new Map([
  ...servicePages.map((servicePage) => [servicePage.href, servicePage] as const),
  [TOP_UP_ALL_FLUIDS_ROUTE, fullServicePage] as const,
]);
const servicePageById = new Map(
  servicePages.map((servicePage) => [servicePage.id, servicePage]),
);

export const serviceCategorySections = serviceCategories.map((category) => ({
  ...category,
  services: category.serviceIds
    .map((serviceId) => servicePageById.get(serviceId))
    .filter((servicePage): servicePage is ServicePageDefinition =>
      Boolean(servicePage),
    ),
}));

export const listedServicePages = serviceCategorySections.flatMap(
  (category) => category.services,
);

export function findServicePageByPath(
  pathname: string,
): ServicePageDefinition | null {
  return servicePageByHref.get(pathname) ?? null;
}
