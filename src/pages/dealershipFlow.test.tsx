import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarsForSalePage from "./CarsForSalePage";
import ContactPage from "./ContactPage";

describe("dealership customer flows", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("presents buying and selling routes without advertising stock", () => {
    render(<CarsForSalePage />);

    expect(
      screen.getByRole("heading", { name: "Looking to Buy or Sell a Car?" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /buy/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /sell/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Current stock")).not.toBeInTheDocument();
    expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument();
  });

  test("prefills a purchase enquiry from a valid vehicle query", () => {
    window.history.replaceState(
      null,
      "",
      "/contact?enquiry=buy-car&vehicle=2018-bmw-3-series",
    );

    render(<ContactPage />);

    expect(screen.getByLabelText("Enquiry Type *")).toHaveValue("buy-car");
    expect(
      (screen.getByLabelText("Message *") as HTMLTextAreaElement).value,
    ).toContain("Purchase Enquiry – 2018 BMW 3 Series");
  });

  test("prefills a selling enquiry and keeps the fields editable", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/contact?enquiry=sell-car");

    render(<ContactPage />);

    const message = screen.getByLabelText("Message *");
    expect(screen.getByLabelText("Enquiry Type *")).toHaveValue("sell-car");
    expect((message as HTMLTextAreaElement).value).toContain(
      "selling my vehicle",
    );

    await user.clear(message);
    await user.type(message, "My editable selling enquiry");
    expect(message).toHaveValue("My editable selling enquiry");
  });

  test("prefills a general buying-requirements template", () => {
    window.history.replaceState(null, "", "/contact?enquiry=buy-car");

    render(<ContactPage />);

    expect(
      (screen.getByLabelText("Message *") as HTMLTextAreaElement).value,
    ).toContain("Preferred make and model");
  });
});
