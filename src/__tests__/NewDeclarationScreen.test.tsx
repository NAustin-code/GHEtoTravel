import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewDeclarationScreen } from "../app/pages/NewDeclarationScreen";
import { createDeclaration, submitDeclaration, updateDeclaration, uploadDeclarationFile, fetchConfig, fetchUserById } from "../services/api";

const mockConfig = {
  highValueThreshold: 5000, mediumValueThreshold: 1000,
  slaEscalationDays: 3, maxDeclarationsPerCounterparty: 5, emailTemplate: "",
};

vi.mock("../services/api", () => ({
  fetchConfig: vi.fn(() => Promise.resolve(mockConfig)),
  fetchUserById: vi.fn(() => Promise.resolve({ id: "user-3", name: "Sipho Nkosi" })),
  fetchManagers: vi.fn(() => Promise.resolve([])),
  fetchDepartments: vi.fn(() => Promise.resolve(["Marketing", "Sales", "Finance"])),
  fetchDropdowns: vi.fn(() => Promise.resolve({ departments: [] })),
  fetchOrganizations: vi.fn(() => Promise.resolve([{ id: "org-1", name: "Hollywoodbets Group", shortCode: "HB" }])),
  createDeclaration: vi.fn(),
  submitDeclaration: vi.fn(),
  updateDeclaration: vi.fn(),
  uploadDeclarationFile: vi.fn(),
}));

vi.mock("../app/components/Sel", () => ({
  Sel: ({ value, onChange, children, placeholder }: any) => (
    <input
      role="combobox"
      data-placeholder={placeholder}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("../app/auth/UserContext", () => ({
  useUser: () => ({
    user: { id: "user-1", name: "Test User", email: "test@hb.co.za", role: "teamMember" as const,
            teamMemberNumber: "HB-10001", department: "Marketing", position: "Brand Manager",
            lineManager: "user-3" },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  class RO {
    cb: any;
    constructor(cb: any) { this.cb = cb; }
    observe() { this.cb([{ contentRect: { width: 400, height: 600 } }]); }
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = RO;
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 600 });
});

function fillTraveler() {
  fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "Thandi Mokoena" } });
  fireEvent.change(screen.getByPlaceholderText("ID or passport number"), { target: { value: "9001015800083" } });
  fireEvent.change(screen.getByPlaceholderText("name@company.co.za"), { target: { value: "thandi@hb.co.za" } });
  fireEvent.change(screen.getByPlaceholderText("082 000 0000"), { target: { value: "0821234567" } });
}

function fillItinerary() {
  fireEvent.change(screen.getByPlaceholderText("Destination"), { target: { value: "Cape Town" } });
  fireEvent.change(screen.getByPlaceholderText("Purpose of the trip"), { target: { value: "Client site visit" } });
  fireEvent.change(screen.getByPlaceholderText("Departure city"), { target: { value: "Durban" } });
  fireEvent.change(screen.getByPlaceholderText("Destination city"), { target: { value: "Cape Town" } });
  const dates = document.querySelectorAll('input[type="date"]');
  fireEvent.change(dates[0], { target: { value: "2026-08-01" } });
  fireEvent.change(dates[1], { target: { value: "2026-08-05" } });
}

function agreeToUndertaking() {
  const boxes = screen.getAllByRole("checkbox");
  fireEvent.click(boxes[boxes.length - 1]);
}

async function fillValidForm() {
  fillTraveler();
  fillItinerary();
  agreeToUndertaking();
}

describe("NewDeclarationScreen (Travel Request)", () => {
  it("renders the travel form with sections", async () => {
    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Traveler Details").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Travel Details").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Accommodation & Transport").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Supporting Documents").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Travel Declaration & Undertaking").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Traveler 1")).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Submit Travel Request/i }));

    await waitFor(() => {
      expect(screen.getByText("Destination is required")).toBeInTheDocument();
      expect(screen.getByText("Departure date is required")).toBeInTheDocument();
      expect(screen.getByText("Return date is required")).toBeInTheDocument();
      expect(screen.getByText("Reason for travel is required")).toBeInTheDocument();
      expect(screen.getByText("Traveler name is required")).toBeInTheDocument();
    });
    expect(createDeclaration).not.toHaveBeenCalled();
  });

  it("rejects a return date before the departure date", async () => {
    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    await fillValidForm();
    const dates = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dates[0], { target: { value: "2026-08-10" } });
    fireEvent.change(dates[1], { target: { value: "2026-08-05" } });

    fireEvent.click(screen.getByRole("button", { name: /Submit Travel Request/i }));

    await waitFor(() => {
      expect(screen.getByText("Return date cannot be before departure date")).toBeInTheDocument();
    });
    expect(createDeclaration).not.toHaveBeenCalled();
  });

  it("calls createDeclaration + submitDeclaration on valid submit", async () => {
    vi.mocked(createDeclaration).mockResolvedValue({ id: "TR-2026-9999", status: "Draft" } as any);
    vi.mocked(submitDeclaration).mockResolvedValue({ id: "TR-2026-9999", status: "Pending", approver: "Sipho Nkosi" } as any);

    const onSuccess = vi.fn();
    render(<NewDeclarationScreen onSubmitSuccess={onSuccess} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Submit Travel Request/i }));

    await waitFor(() => {
      expect(createDeclaration).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: "Cape Town",
          departureDate: "2026-08-01",
          returnDate: "2026-08-05",
          reason: "Client site visit",
          numberOfPeople: 1,
          travelType: "Domestic",
        })
      );
      const payload = vi.mocked(createDeclaration).mock.calls[0][0] as any;
      expect(payload.travelers).toHaveLength(1);
      expect(payload.travelers[0]).toMatchObject({
        name: "Thandi Mokoena",
        email: "thandi@hb.co.za",
        cellPhone: "0821234567",
      });
      expect(submitDeclaration).toHaveBeenCalledWith("TR-2026-9999");
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("calls createDeclaration on Save Draft without requiring validation", async () => {
    vi.mocked(createDeclaration).mockResolvedValue({ id: "TR-2026-9999", status: "Draft" } as any);

    const onDraftSaved = vi.fn();
    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={onDraftSaved} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Destination"), { target: { value: "Cape Town" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Draft/i }));

    await waitFor(() => {
      expect(createDeclaration).toHaveBeenCalledWith(
        expect.objectContaining({ destination: "Cape Town", status: "Draft" })
      );
      expect(onDraftSaved).toHaveBeenCalled();
    });
  });

  it("shows submit error when API fails", async () => {
    vi.mocked(createDeclaration).mockRejectedValue(new Error("Server error"));

    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Submit Travel Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });

  it("shows error when save draft fails", async () => {
    vi.mocked(createDeclaration).mockRejectedValue(new Error("Draft save failed"));

    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Save Draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/Draft save failed/)).toBeInTheDocument();
    });
  });

  it("adds traveler blocks when number of people increases", async () => {
    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    expect(screen.queryByText("Traveler 2")).not.toBeInTheDocument();
    const combos = screen.getAllByRole("combobox");
    fireEvent.change(combos[0], { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.getByText("Traveler 2")).toBeInTheDocument();
    });
  });

  it("rejects unsupported file types", async () => {
    const { container } = render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    const fileInput = container.querySelector('input[type="file"]')!;
    const file = new File(["dummy"], "test.html", { type: "text/html" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
    });
  });

  it("uploads a supported file and lists it with remove option", async () => {
    const { container } = render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    vi.mocked(uploadDeclarationFile).mockResolvedValue({
      name: "quote.pdf", size: 5, type: "application/pdf", url: "local:file/pending/quote.pdf",
    });
    const fileInput = container.querySelector('input[type="file"]')!;
    const file = new File(["dummy"], "quote.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("quote.pdf")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Remove quote.pdf/i }));
    await waitFor(() => {
      expect(screen.queryByText("quote.pdf")).not.toBeInTheDocument();
    });
  });
});
