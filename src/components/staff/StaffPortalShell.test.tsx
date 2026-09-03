import { render, screen } from "@testing-library/react";
import StaffPortalShell from "./StaffPortalShell";

describe("StaffPortalShell role navigation", () => {
  test("Admin can see all portal modules", () => {
    render(<StaffPortalShell currentPath="/dashboard" staffName="Admin" staffRole="admin" onSignOut={jest.fn()}><div>Content</div></StaffPortalShell>);
    expect(screen.getByRole("button", { name: "Marketplace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Job assignment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Staff" })).toBeInTheDocument();
  });

  test("Ops cannot see staff management", () => {
    render(<StaffPortalShell currentPath="/dashboard" staffName="Ops" staffRole="ops" onSignOut={jest.fn()}><div>Content</div></StaffPortalShell>);
    expect(screen.getByRole("button", { name: "Marketplace" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Staff" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mechanic jobs" })).not.toBeInTheDocument();
  });

  test("Mechanic sees only dashboard and mechanic jobs", () => {
    render(<StaffPortalShell currentPath="/mechanic/jobs" staffName="Mechanic" staffRole="mechanic" onSignOut={jest.fn()}><div>Content</div></StaffPortalShell>);
    expect(screen.getByRole("button", { name: "Mechanic jobs" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Marketplace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Job assignment" })).not.toBeInTheDocument();
  });
});
