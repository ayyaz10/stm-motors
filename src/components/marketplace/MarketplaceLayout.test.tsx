import { render, screen } from "@testing-library/react";
import MarketplaceLayout from "./MarketplaceLayout";

describe("marketplace layout", () => {
  test("keeps service bookings on the .com domain", () => {
    render(
      <MarketplaceLayout currentPath="/cars">
        <p>Inventory</p>
      </MarketplaceLayout>,
    );

    expect(screen.getByRole("link", { name: "Book a Service" })).toHaveAttribute(
      "href",
      "https://stmmotors.com/book",
    );
  });
});

