import { render, screen } from "@testing-library/react";
import MarketplaceAdminShell from "./MarketplaceAdminShell";

describe("MarketplaceAdminShell permissions", () => {
  test("shows staff management to Admin users", () => {
    render(
      <MarketplaceAdminShell
        currentPath="/admin/vehicles"
        staffName="Admin User"
        staffRole="admin"
        onSignOut={jest.fn()}
      >
        <div>Dashboard</div>
      </MarketplaceAdminShell>,
    );

    expect(screen.getByRole("button", { name: "Staff" })).toBeInTheDocument();
  });

  test("hides staff management from Ops users", () => {
    render(
      <MarketplaceAdminShell
        currentPath="/admin/vehicles"
        staffName="Ops User"
        staffRole="ops"
        onSignOut={jest.fn()}
      >
        <div>Dashboard</div>
      </MarketplaceAdminShell>,
    );

    expect(screen.queryByRole("button", { name: "Staff" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add vehicle" })).toBeInTheDocument();
  });
});
