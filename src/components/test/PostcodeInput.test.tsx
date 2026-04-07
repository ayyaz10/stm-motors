import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostcodeInput from "./PostcodeInput";

describe("PostcodeInput Component", () => {
  test("renders input field with label", () => {
    render(<PostcodeInput onValidChange={jest.fn()} />);

    expect(screen.getByLabelText("UK Postcode")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. SW1A 1AA")).toBeInTheDocument();
  });

  test("shows no validation messages initially", () => {
    render(<PostcodeInput onValidChange={jest.fn()} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("shows success message for valid postcode after blur", async () => {
    const user = userEvent.setup();
    render(<PostcodeInput onValidChange={jest.fn()} />);

    const input = screen.getByLabelText("UK Postcode");
    await user.type(input, "SW1A 1AA");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("✓ Valid postcode");
    });
    expect(input).toHaveClass("valid");
  });

  test("shows error message for invalid postcode after blur", async () => {
    const user = userEvent.setup();
    render(<PostcodeInput onValidChange={jest.fn()} />);

    const input = screen.getByLabelText("UK Postcode");
    await user.type(input, "INVALID");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter a valid UK postcode",
      );
    });
    expect(input).toHaveClass("invalid");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("updates validation in real-time after first blur", async () => {
    const user = userEvent.setup();
    render(<PostcodeInput onValidChange={jest.fn()} />);

    const input = screen.getByLabelText("UK Postcode");

    // Type invalid and blur
    await user.type(input, "INVALID");
    fireEvent.blur(input);

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    // Clear and type valid
    await user.clear(input);
    await user.type(input, "SW1A 1AA");

    // Should now show success
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("calls onValidChange callback with validation status", async () => {
    const user = userEvent.setup();
    const onValidChange = jest.fn();

    render(<PostcodeInput onValidChange={onValidChange} />);

    const input = screen.getByLabelText("UK Postcode");

    // Type invalid and blur
    await user.type(input, "INVALID");
    fireEvent.blur(input);
    expect(onValidChange).toHaveBeenLastCalledWith(false);

    // Change to valid
    await user.clear(input);
    await user.type(input, "SW1A 1AA");
    expect(onValidChange).toHaveBeenLastCalledWith(true);
  });

  test("handles empty input after blur", async () => {
    const user = userEvent.setup();
    render(<PostcodeInput onValidChange={jest.fn()} />);

    const input = screen.getByLabelText("UK Postcode");
    await user.type(input, "SW1A 1AA");
    fireEvent.blur(input);

    expect(await screen.findByRole("status")).toBeInTheDocument();

    // Clear input
    await user.clear(input);
    fireEvent.blur(input);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("accepts initial value prop", () => {
    render(<PostcodeInput onValidChange={jest.fn()} initialValue="SW1A 1AA" />);

    const input = screen.getByLabelText("UK Postcode");
    expect(input).toHaveValue("SW1A 1AA");
  });

  test("applies custom className", () => {
    render(
      <PostcodeInput onValidChange={jest.fn()} className="custom-class" />,
    );

    const input = screen.getByLabelText("UK Postcode");
    expect(input).toHaveClass("custom-class");
  });
});
