import {
  getFixarooCategories,
  resolveFixarooServiceParts,
  toFixarooModelSlug,
  toFixarooSlug,
  type FixarooPartCandidate,
} from "./fixarooPricing";

const part = (
  overrides: Partial<FixarooPartCandidate>,
): FixarooPartCandidate => ({
  category: "brakes",
  currency: "GBP",
  id: "part-1",
  inStock: true,
  name: "Brembo Front Brake Pads",
  price: 34.99,
  ...overrides,
});

describe("Fixaroo pricing rules", () => {
  test("normalizes make-prefixed catalog models for Fixaroo URLs", () => {
    expect(toFixarooSlug("Mercedes-Benz")).toBe("mercedes-benz");
    expect(toFixarooModelSlug("Ford", "FORD FIESTA")).toBe("fiesta");
  });

  test("requests each required category only once", () => {
    expect(
      getFixarooCategories([
        "brake-pads-front-all",
        "disc-and-pad-replacement-front-all",
        "air-filter-replacement",
      ]),
    ).toEqual(["brakes", "filters"]);
  });

  test("selects the lowest matching in-stock GBP part", () => {
    const result = resolveFixarooServiceParts("brake-pads-front-all", {
      brakes: [
        part({ id: "rear", name: "Rear Brake Pads", price: 19.99 }),
        part({ id: "premium", price: 44.99 }),
        part({ id: "selected", price: 34.99 }),
        part({ id: "usd", currency: "USD", price: 10 }),
      ],
    });

    expect(result).toEqual({
      partsPrice: 34.99,
      selectedParts: [
        {
          brand: null,
          id: "selected",
          name: "Brembo Front Brake Pads",
          partNumber: null,
          quantity: 1,
          unitPrice: 34.99,
        },
      ],
    });
  });

  test("prices two individual discs but one disc pair", () => {
    const individualResult = resolveFixarooServiceParts(
      "disc-and-pad-replacement-front-all",
      {
        brakes: [
          part({ id: "pads", price: 30 }),
          part({ id: "disc", name: "Front Brake Disc", price: 25 }),
        ],
      },
    );
    const pairResult = resolveFixarooServiceParts(
      "disc-and-pad-replacement-front-all",
      {
        brakes: [
          part({ id: "pads", price: 30 }),
          part({
            id: "disc-pair",
            name: "Front Brake Disc Pair",
            price: 45,
          }),
        ],
      },
    );

    expect(individualResult?.partsPrice).toBe(80);
    expect(pairResult?.partsPrice).toBe(75);
  });

  test("returns labour-only parts for fault-dependent services", () => {
    expect(resolveFixarooServiceParts("suspension-repairs", {})).toEqual({
      partsPrice: 0,
      selectedParts: [],
    });
  });

  test("returns null instead of inventing a price when a required part is missing", () => {
    expect(
      resolveFixarooServiceParts("cabin-filter-replacement", { filters: [] }),
    ).toBeNull();
  });
});
