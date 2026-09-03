import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { VehiclePricingLoadState } from "../../lib/useVehicleServicePricing";
import WorkSelection from "./WorkSelection";

const vehiclePricingState: VehiclePricingLoadState = {
  status: "success",
  error: null,
  pricing: {
    mappingReason: "small_model_rule",
    vehicleCategory: "small",
    vehicleModelId: 774,
    pricesByServiceId: {
      "brake-pads-front-all": {
        price: 87,
        pricingType: "estimated",
        serviceId: "brake-pads-front-all",
      },
    },
  },
};

function WorkSelectionHarness({
  initialSelectedWorks = [],
  pricingState = vehiclePricingState,
}: {
  initialSelectedWorks?: string[];
  pricingState?: VehiclePricingLoadState;
}) {
  const [selectedWorks, setSelectedWorks] = useState<string[]>(
    initialSelectedWorks,
  );

  return (
    <WorkSelection
      formPlateData={{ registration: "", postcode: "" }}
      formDetailsData={{
        vehicleModelId: 774,
        make: "Ford",
        model: "FORD FIESTA",
        fuel: "PETROL",
        engine: "1201cc to 1300cc",
        year: "2020",
        postcode: "SW1A 1AA",
      }}
      vehiclePricingState={pricingState}
      selectedWorks={selectedWorks}
      setSelectedWorks={setSelectedWorks}
      goToNextStep={jest.fn()}
      goToPreviousStep={jest.fn()}
      goToVehicleStep={jest.fn()}
    />
  );
}

describe("booking work selection pricing", () => {
  test("adds a selected service and its vehicle price immediately", async () => {
    const user = userEvent.setup();
    render(<WorkSelectionHarness />);

    expect(screen.queryByText("Update selected services")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.length === 3 && content.endsWith("87"),
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: /Brake pads replacement - front/i,
      }),
    );

    expect(screen.getByRole("heading", { name: "£87" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Includes estimated parts, labour and mobile mechanic visit\. Final price is confirmed after we verify your vehicle and required parts\. In most cases, the price stays the same\./i,
      ),
    ).toBeInTheDocument();
  });

  test("shows the from-price disclaimer for variable repair pricing", () => {
    const fromPricingState: VehiclePricingLoadState = {
      status: "success",
      error: null,
      pricing: {
        mappingReason: "suv_body_type",
        vehicleCategory: "suv_premium",
        vehicleModelId: 774,
        pricesByServiceId: {
          "suspension-repairs": {
            price: 272,
            pricingType: "from",
            serviceId: "suspension-repairs",
          },
        },
      },
    };

    render(
      <WorkSelectionHarness
        initialSelectedWorks={["suspension-repairs"]}
        pricingState={fromPricingState}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "From £272" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Starting price includes estimated parts, labour and mobile mechanic visit\. The final price depends on the exact fault, parts required and vehicle specification\. We will confirm the final price before any work begins\./i,
      ),
    ).toBeInTheDocument();
  });
});
