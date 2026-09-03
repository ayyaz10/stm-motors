import {
  formatVehicleServicePrice,
  getSelectedVehiclePricingSummary,
  type VehiclePricingResult,
} from "./vehiclePricing";

const pricing: VehiclePricingResult = {
  mappingReason: "small_model_rule",
  vehicleCategory: "small",
  vehicleModelId: 774,
  pricesByServiceId: {
    "brake-pads-front-all": {
      price: 87,
      pricingType: "estimated",
      serviceId: "brake-pads-front-all",
    },
    "suspension-repairs": {
      price: 161,
      pricingType: "from",
      serviceId: "suspension-repairs",
    },
  },
};

describe("vehicle service pricing", () => {
  test("formats normal estimated prices without adding VAT", () => {
    expect(
      formatVehicleServicePrice(
        pricing.pricesByServiceId["brake-pads-front-all"],
      ),
    ).toBe("£87");
  });

  test("formats variable repairs as from prices", () => {
    expect(
      formatVehicleServicePrice(
        pricing.pricesByServiceId["suspension-repairs"],
      ),
    ).toBe("From £161");
  });

  test("totals selected estimated services", () => {
    expect(
      getSelectedVehiclePricingSummary(
        ["brake-pads-front-all"],
        pricing,
      ),
    ).toEqual({
      displayLabel: "£87",
      hasFromPrices: false,
      totalPrice: 87,
    });
  });

  test("uses a from total when any selected service is variable", () => {
    expect(
      getSelectedVehiclePricingSummary(
        ["brake-pads-front-all", "suspension-repairs"],
        pricing,
      ),
    ).toEqual({
      displayLabel: "From £248",
      hasFromPrices: true,
      totalPrice: 248,
    });
  });

  test("does not invent a total when a selected price is missing", () => {
    expect(
      getSelectedVehiclePricingSummary(["unknown-service"], pricing),
    ).toBeNull();
  });
});

