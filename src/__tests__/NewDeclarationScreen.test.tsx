import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewDeclarationScreen } from "../app/pages/NewDeclarationScreen";
import { createDeclaration, submitDeclaration, updateDeclaration, uploadDeclarationFile } from "../services/api";

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
  Sel: ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input
      role="combobox"
      data-placeholder={placeholder}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));


import type { Declaration } from "../types/declaration";

const declResult = (overrides: Partial<Declaration> = {}): Declaration => ({
  id: "TR-2026-9999",
  employee: "Test User",
  employeeId: "user-1",
  department: "Marketing",
  type: "Domestic",
  counterparty: "Cape Town",
  value: 0,
  submitted: "2026-07-01",
  approver: "",
  status: "Draft",
  priority: "Low",
  description: "",
  relationship: "",
  teamMemberNumber: "HB-10001",
  lineManager: "",
  position: "",
  receivedGiven: "",
  from: "",
  contactPerson: "",
  biddingProcess: "",
  occasion: "",
  date: "",
  instances: "1",
  publicOfficial: "",
  ...overrides,
});

vi.mock("../app/auth/UserContext", () => ({
  useUser: () => ({
    user: { id: "user-1", name: "Test User", email: "test@hb.co.za", role: "teamMember" as const,
            teamMemberNumber: "HB-10001", department: "Marketing", position: "Brand Manager",
            lineManager: "user-3" },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  type ResizeHandler = (entries: { contentRect: { width: number; height: number } }[]) => void;
  class RO {
    constructor(private cb: ResizeHandler) {}
    observe() { this.cb([{ contentRect: { width: 400, height: 600 } }]); }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
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
  // Mocked Sel inputs render in DOM order: people, billed company, gender,
  // internal/external, travel type, then trip type.
  fireEvent.change(screen.getAllByRole("combobox")[6], { target: { value: "Return" } });
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
      expect(screen.getByText("Trip type is required")).toBeInTheDocument();
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
    vi.mocked(createDeclaration).mockResolvedValue(declResult({ status: "Draft" }));
    vi.mocked(submitDeclaration).mockResolvedValue(declResult({ status: "Pending", approver: "Sipho Nkosi" }));

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
          tripType: "Return",
        })
      );
      const payload = vi.mocked(createDeclaration).mock.calls[0][0];
      const travelers = payload.travelers ?? [];
      expect(travelers).toHaveLength(1);
      expect(travelers[0]).toMatchObject({
        name: "Thandi Mokoena",
        email: "thandi@hb.co.za",
        cellPhone: "0821234567",
        internalExternal: "Internal",
      });
      expect(submitDeclaration).toHaveBeenCalledWith("TR-2026-9999");
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("calls createDeclaration on Save Draft without requiring validation", async () => {
    vi.mocked(createDeclaration).mockResolvedValue(declResult({ status: "Draft" }));

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

  it("stages a supported file without uploading until save", async () => {
    const { container } = render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    const fileInput = container.querySelector('input[type="file"]')!;
    const file = new File(["dummy"], "quote.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("quote.pdf")).toBeInTheDocument();
    });
    expect(vi.mocked(uploadDeclarationFile)).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Remove quote.pdf/i }));
    await waitFor(() => {
      expect(screen.queryByText("quote.pdf")).not.toBeInTheDocument();
    });
  });

  it("uploads staged files on submit and attaches them to the request", async () => {
    vi.mocked(createDeclaration).mockResolvedValue(declResult({ status: "Draft" }));
    vi.mocked(updateDeclaration).mockResolvedValue(declResult({ status: "Draft" }));
    vi.mocked(submitDeclaration).mockResolvedValue(declResult({ status: "Pending" }));
    vi.mocked(uploadDeclarationFile).mockResolvedValue({
      name: "quote.pdf", size: 5, type: "application/pdf", url: "local:file/TR-2026-9999/quote.pdf",
    });

    const { container } = render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());
    await fillValidForm();

    const fileInput = container.querySelector('input[type="file"]')!;
    const file = new File(["dummy"], "quote.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);
    await waitFor(() => expect(screen.getByText("quote.pdf")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Submit Travel Request/i }));

    await waitFor(() => {
      expect(vi.mocked(uploadDeclarationFile)).toHaveBeenCalledWith(
        expect.objectContaining({ name: "quote.pdf" }),
        "TR-2026-9999"
      );
      expect(vi.mocked(updateDeclaration)).toHaveBeenCalledWith(
        "TR-2026-9999",
        expect.objectContaining({ files: expect.arrayContaining([expect.objectContaining({ name: "quote.pdf" })]) })
      );
      expect(submitDeclaration).toHaveBeenCalledWith("TR-2026-9999");
    });
  });

  it("reuses the same id when saving a draft twice", async () => {
    vi.mocked(createDeclaration).mockImplementation(async (d: Partial<Declaration>) => declResult({ ...d, status: "Draft" }));

    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Destination"), { target: { value: "Cape Town" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Draft/i }));
    await waitFor(() => expect(createDeclaration).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /Save Draft/i }));
    await waitFor(() => expect(createDeclaration).toHaveBeenCalledTimes(2));

    const calls = vi.mocked(createDeclaration).mock.calls.map((c) => c[0].id);
    expect(calls[0]).toBeTruthy();
    expect(calls[1]).toBe(calls[0]);
  });

  it("surfaces submit failures instead of reporting success", async () => {
    vi.mocked(createDeclaration).mockResolvedValue(declResult({ status: "Draft" }));
    vi.mocked(submitDeclaration).mockRejectedValue(new Error("Submit failed"));

    const onSuccess = vi.fn();
    render(<NewDeclarationScreen onSubmitSuccess={onSuccess} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Submit Travel Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Submit failed/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("rejects invalid traveler contact details", async () => {
    render(<NewDeclarationScreen onSubmitSuccess={vi.fn()} onDraftSaved={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/New Travel Request/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "Thandi Mokoena" } });
    fireEvent.change(screen.getByPlaceholderText("ID or passport number"), { target: { value: "9001015800083" } });
    fireEvent.change(screen.getByPlaceholderText("name@company.co.za"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByPlaceholderText("082 000 0000"), { target: { value: "123" } });
    fireEvent.change(screen.getByPlaceholderText("Destination"), { target: { value: "Cape Town" } });
    fireEvent.change(screen.getByPlaceholderText("Purpose of the trip"), { target: { value: "Visit" } });
    const dates = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dates[0], { target: { value: "2026-08-01" } });
    fireEvent.change(dates[1], { target: { value: "2026-08-05" } });
    const boxes = screen.getAllByRole("checkbox");
    fireEvent.click(boxes[boxes.length - 1]);

    fireEvent.click(screen.getByRole("button", { name: /Submit Travel Request/i }));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
      expect(screen.getByText("Enter a valid cell number (at least 9 digits)")).toBeInTheDocument();
    });
    expect(createDeclaration).not.toHaveBeenCalled();
  });
});
