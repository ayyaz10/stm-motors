export const DEFAULT_FIXAROO_LABOUR_PRICE = 40;

export interface FixarooPartCandidate {
  brand?: string;
  category: string;
  currency: string;
  id: string;
  inStock: boolean;
  name: string;
  partNumber?: string;
  price: number;
}

export interface FixarooSelectedPart {
  brand: string | null;
  id: string;
  name: string;
  partNumber: string | null;
  quantity: number;
  unitPrice: number;
}

export interface FixarooResolvedParts {
  partsPrice: number;
  selectedParts: FixarooSelectedPart[];
}

interface PartRequirement {
  category: string;
  exclude?: string[];
  match: string[][];
  quantity?: number;
}

interface ServicePartRule {
  requirements: PartRequirement[];
}

const servicePartRules: Record<string, ServicePartRule> = {
  "brake-pads-front-all": {
    requirements: [
      {
        category: "brakes",
        match: [["brake pad", "brake pads"], ["front"]],
      },
    ],
  },
  "brake-pads-rear-all": {
    requirements: [
      {
        category: "brakes",
        match: [["brake pad", "brake pads"], ["rear"]],
      },
    ],
  },
  "disc-and-pad-replacement-front-all": {
    requirements: [
      {
        category: "brakes",
        match: [["brake pad", "brake pads"], ["front"]],
      },
      {
        category: "brakes",
        match: [["brake disc", "brake rotor"], ["front"]],
        quantity: 2,
      },
    ],
  },
  "disc-and-pad-replacement-rear-all": {
    requirements: [
      {
        category: "brakes",
        match: [["brake pad", "brake pads"], ["rear"]],
      },
      {
        category: "brakes",
        match: [["brake disc", "brake rotor"], ["rear"]],
        quantity: 2,
      },
    ],
  },
  "brake-caliper-replacement": {
    requirements: [
      {
        category: "brakes",
        match: [["brake caliper", "caliper"]],
      },
    ],
  },
  "brake-fluid-replacement": {
    requirements: [
      {
        category: "brakes",
        match: [["brake fluid"]],
      },
    ],
  },
  "engine-oil-filter-replacement": {
    requirements: [
      {
        category: "filters",
        match: [["oil filter"]],
      },
      {
        category: "engine",
        match: [["engine oil", "motor oil"]],
      },
    ],
  },
  "air-filter-replacement": {
    requirements: [
      {
        category: "filters",
        exclude: ["cabin", "pollen", "oil"],
        match: [["air filter"]],
      },
    ],
  },
  "cabin-filter-replacement": {
    requirements: [
      {
        category: "filters",
        match: [["cabin filter", "pollen filter"]],
      },
    ],
  },
  "engine-flush": {
    requirements: [
      {
        category: "engine",
        match: [["engine flush", "oil system cleaner"]],
      },
    ],
  },
  "full-service": {
    requirements: [
      { category: "filters", match: [["oil filter"]] },
      {
        category: "filters",
        exclude: ["cabin", "pollen", "oil"],
        match: [["air filter"]],
      },
      {
        category: "filters",
        match: [["cabin filter", "pollen filter"]],
      },
      {
        category: "engine",
        match: [["engine oil", "motor oil"]],
      },
    ],
  },
  "top-up-all-fluids": {
    requirements: [
      {
        category: "engine",
        match: [["engine oil", "motor oil"]],
      },
      {
        category: "cooling",
        match: [["coolant", "antifreeze"]],
      },
      {
        category: "brakes",
        match: [["brake fluid"]],
      },
    ],
  },
  "battery-service": {
    requirements: [
      {
        category: "battery",
        exclude: ["charger", "tester", "terminal"],
        match: [["battery"]],
      },
    ],
  },
  "engine-diagnostic-service": { requirements: [] },
  "heating-repair": { requirements: [] },
  "air-conditioning-repair": { requirements: [] },
  "suspension-repairs": { requirements: [] },
  "steering-system-repairs": { requirements: [] },
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function toFixarooSlug(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, "-");
}

export function toFixarooModelSlug(make: string, model: string): string {
  const normalizedMake = normalizeSearchText(make);
  let normalizedModel = normalizeSearchText(model);

  if (normalizedModel.startsWith(`${normalizedMake} `)) {
    normalizedModel = normalizedModel.slice(normalizedMake.length + 1);
  }

  return normalizedModel.replace(/\s+/g, "-");
}

export function getFixarooCategories(serviceIds: string[]): string[] {
  return [
    ...new Set(
      serviceIds.flatMap(
        (serviceId) =>
          servicePartRules[serviceId]?.requirements.map(
            (requirement) => requirement.category,
          ) ?? [],
      ),
    ),
  ];
}

function isPack(partName: string): boolean {
  const normalizedName = normalizeSearchText(partName);
  return ["pair", "set", "kit", "2 pack", "two pack"].some((term) =>
    normalizedName.includes(term),
  );
}

function matchesRequirement(
  part: FixarooPartCandidate,
  requirement: PartRequirement,
): boolean {
  if (!part.inStock || part.currency.toUpperCase() !== "GBP" || part.price <= 0) {
    return false;
  }

  const searchableText = normalizeSearchText(
    `${part.name} ${part.brand ?? ""} ${part.partNumber ?? ""}`,
  );

  if (
    requirement.exclude?.some((term) =>
      searchableText.includes(normalizeSearchText(term)),
    )
  ) {
    return false;
  }

  return requirement.match.every((termGroup) =>
    termGroup.some((term) =>
      searchableText.includes(normalizeSearchText(term)),
    ),
  );
}

export function resolveFixarooServiceParts(
  serviceId: string,
  partsByCategory: Record<string, FixarooPartCandidate[]>,
): FixarooResolvedParts | null {
  const rule = servicePartRules[serviceId];

  if (!rule) {
    return null;
  }

  if (rule.requirements.length === 0) {
    return { partsPrice: 0, selectedParts: [] };
  }

  const selectedParts: FixarooSelectedPart[] = [];

  for (const requirement of rule.requirements) {
    const candidate = (partsByCategory[requirement.category] ?? [])
      .filter((part) => matchesRequirement(part, requirement))
      .sort((left, right) => left.price - right.price)[0];

    if (!candidate) {
      return null;
    }

    const quantity =
      requirement.quantity && !isPack(candidate.name)
        ? requirement.quantity
        : 1;

    selectedParts.push({
      brand: candidate.brand?.trim() || null,
      id: candidate.id,
      name: candidate.name,
      partNumber: candidate.partNumber?.trim() || null,
      quantity,
      unitPrice: candidate.price,
    });
  }

  return {
    partsPrice: Number(
      selectedParts
        .reduce(
          (total, selectedPart) =>
            total + selectedPart.unitPrice * selectedPart.quantity,
          0,
        )
        .toFixed(2),
    ),
    selectedParts,
  };
}
