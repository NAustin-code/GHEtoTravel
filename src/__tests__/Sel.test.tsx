import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Sel } from "../app/components/Sel";

function renderCompanySel(value: string, onChange: (v: string) => void) {
  return render(
    <Sel value={value} onChange={onChange}>
      <option value="">Select company</option>
      <option value="ACME">ACME</option>
      <option value="BGS">BGS</option>
    </Sel>,
  );
}

describe("Sel", () => {
  it("shows the placeholder option text when no value is selected", () => {
    renderCompanySel("", vi.fn());
    expect(screen.getByText("Select company")).toBeInTheDocument();
  });

  it("keeps the empty option selectable so a choice can be cleared", async () => {
    type ResizeHandler = (entries: { contentRect: { width: number; height: number } }[]) => void;
    class RO {
      constructor(private cb: ResizeHandler) {}
      observe() { this.cb([{ contentRect: { width: 200, height: 40 } }]); }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", RO);
    Element.prototype.scrollIntoView = vi.fn();
    // jsdom lacks pointer-capture APIs that Radix Select relies on.
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};

    const onChange = vi.fn();
    renderCompanySel("ACME", onChange);

    fireEvent.pointerDown(screen.getByRole("combobox"), { pointerType: "mouse", button: 0 });
    const clearOption = await screen.findByRole("option", { name: "Select company" });
    fireEvent.click(clearOption);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(""));
  });
});
