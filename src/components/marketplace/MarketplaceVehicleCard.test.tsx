import { render, screen } from "@testing-library/react";
import type { MarketplaceVehicleListing } from "../../lib/marketplace";
import MarketplaceVehicleCard from "./MarketplaceVehicleCard";

const baseVehicle: MarketplaceVehicleListing = {
  id: "4f24bdd3-f61d-4df7-9153-a4459d0bb6be",
  slug: "2021-toyota-c-hr",
  stock_reference: "STM-001",
  make: "Toyota",
  model: "C-HR",
  derivative: "1.8 Hybrid Design",
  year: 2021,
  price: 19495,
  mileage: 28700,
  fuel_type: "Hybrid",
  transmission: "Automatic",
  body_type: "SUV",
  engine_size: "1.8L",
  colour: "Blue",
  doors: 5,
  seats: 5,
  previous_owners: 1,
  service_history: "Full service history",
  mot_expiry: "2027-04-01",
  description: "A well-presented hybrid crossover.",
  features: ["Reversing camera"],
  specifications: {},
  status: "published",
  featured: true,
  published_at: "2026-08-24T10:00:00Z",
  created_at: "2026-08-24T10:00:00Z",
  updated_at: "2026-08-24T10:00:00Z",
  images: [],
};

describe("marketplace vehicle card", () => {
  test("shows an available published vehicle and its details", () => {
    render(<MarketplaceVehicleCard vehicle={baseVehicle} />);
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("C-HR")).toBeInTheDocument();
    expect(screen.getByText("28,700 miles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Details" })).toHaveAttribute(
      "href",
      "/cars/2021-toyota-c-hr",
    );
  });

  test.each(["reserved", "sold"] as const)(
    "shows the %s state clearly",
    (status) => {
      render(<MarketplaceVehicleCard vehicle={{ ...baseVehicle, status }} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    },
  );
});

