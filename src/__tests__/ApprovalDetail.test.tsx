import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApprovalDetail } from "../app/pages/ApprovalDetail";
import { fetchWorkflowInstance, approveWorkflowStep } from "../services/api";
import type { WorkflowDecisionResult } from "../services/api";
import type { WorkflowInstance } from "../types/declaration";

const decisionResult = (newStatus: WorkflowDecisionResult["newStatus"]): WorkflowDecisionResult => ({
  declarationId: "GHE-2026-1001",
  steps: [],
  status: newStatus,
  newStatus,
});

const mockDeclaration = {
  id: "GHE-2026-1001", employee: "Alice", employeeId: "user-1", department: "IT",
  type: "Gift", counterparty: "CorpA", value: 5000, submitted: "2026-07-01",
  approver: "Sipho Nkosi", status: "Pending" as const, priority: "High" as const,
  description: "Test", relationship: "Yes", teamMemberNumber: "TM-001",
  lineManager: "Sipho Nkosi", position: "Dev", receivedGiven: "Received",
  from: "Supplier", contactPerson: "Jane", biddingProcess: "No",
  occasion: "Business Meeting", date: "2026-07-01", instances: "1",
  publicOfficial: "No",
};

const mockWorkflow = {
  declarationId: "GHE-2026-1001",
  steps: [
    { order: 1, role: "lineManager" as const, assignee: "user-3", assigneeName: "Sipho Nkosi",
      label: "Line Manager Review", status: "pending" as const, decision: null, notes: "", decidedAt: null, decidedById: null, decidedByName: null },
    { order: 2, role: "hr" as const, assignee: "user-4", assigneeName: "Lindiwe Zulu",
      label: "HR Review", status: "pending" as const, decision: null, notes: "", decidedAt: null, decidedById: null, decidedByName: null },
  ],
};

let mockUserStep: WorkflowInstance;

vi.mock("../services/api", () => ({
  fetchWorkflowInstance: vi.fn(),
  approveWorkflowStep: vi.fn(),
  fetchConfig: vi.fn(() => Promise.resolve({
    highValueThreshold: 1000, mediumValueThreshold: 1000,
    slaEscalationDays: 3, maxDeclarationsPerCounterparty: 5, emailTemplate: "",
  })),
}));

vi.mock("../app/auth/UserContext", () => ({
  useUser: () => ({
    user: { id: "user-current", name: "Current User", email: "cur@test.com", role: "approver" as const,
            teamMemberNumber: "APR-001", department: "Marketing", position: "LM", lineManager: "user-5" },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  type ResizeHandler = (entries: { contentRect: { width: number; height: number } }[]) => void;
  class RO {
    constructor(private cb: ResizeHandler) {}
    observe() { this.cb([{ contentRect: { width: 800, height: 600 } }]); }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 600 });
  mockUserStep = {
    ...mockWorkflow,
    steps: mockWorkflow.steps.map((s, i) =>
      i === 0 ? { ...s, assignee: "user-current" } : { ...s }
    ),
  };
});

describe("ApprovalDetail", () => {
  it("shows loading state while fetching workflow", () => {
    vi.mocked(fetchWorkflowInstance).mockReturnValue(new Promise(() => {}));
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    expect(screen.getByText("Loading workflow…")).toBeInTheDocument();
  });

  it("renders declaration info and workflow after load", async () => {
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("GHE-2026-1001")).toBeInTheDocument();
    });
    expect(screen.getByText("1. Line Manager Approval")).toBeInTheDocument();
  });

  it("shows decision buttons for the current user's pending step", async () => {
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Decision *")).toBeInTheDocument();
    });
    expect(screen.getByText(/Return - Team member/)).toBeInTheDocument();
  });

  it("does not crash when user has no pending step (read-only view)", async () => {
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockWorkflow);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("GHE-2026-1001")).toBeInTheDocument();
    });
    expect(screen.queryByText("Decision *")).not.toBeInTheDocument();
  });

  it("selects a decision and highlights the radio option", async () => {
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Decision *")).toBeInTheDocument();
    });

    const acceptLabel = screen.getByText(/Team member travel request approved/);
    fireEvent.click(acceptLabel);
    const labelEl = acceptLabel.closest("label")!;
    expect(labelEl.className).toContain("border-primary");
  });

  it("submits decision and calls approveWorkflowStep", async () => {
    vi.mocked(approveWorkflowStep).mockResolvedValue(decisionResult("Pending"));
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Decision *")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Team member travel request approved/));
    fireEvent.click(screen.getByText("Submit Decision"));

    await waitFor(() => {
      expect(approveWorkflowStep).toHaveBeenCalledWith(
        expect.objectContaining({ declarationId: "GHE-2026-1001", decision: "accept" })
      );
    });
  });

  it("shows success message after submission", async () => {
    vi.mocked(approveWorkflowStep).mockResolvedValue(decisionResult("Pending"));
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Decision *")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Team member travel request approved/));
    fireEvent.click(screen.getByText("Submit Decision"));

    await waitFor(() => {
      expect(screen.getByText("Decision submitted successfully.")).toBeInTheDocument();
    });
  });

  it("calls onBack when Back button is clicked", async () => {
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    const onBack = vi.fn();
    render(<ApprovalDetail declaration={mockDeclaration} onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText("GHE-2026-1001")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("shows notes textarea when user has pending step", async () => {
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Add notes or reasoning...")).toBeInTheDocument();
    });
  });

  it("submits 'decline' decision and updates status to Declined", async () => {
    vi.mocked(approveWorkflowStep).mockResolvedValue(decisionResult("Declined"));
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Decision *")).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Travel request declined/));
    fireEvent.click(screen.getByText("Submit Decision"));

    await waitFor(() => {
      expect(approveWorkflowStep).toHaveBeenCalledWith(
        expect.objectContaining({ declarationId: "GHE-2026-1001", decision: "decline" })
      );
    });
    await waitFor(() => {
      expect(screen.getByText("Declined")).toBeInTheDocument();
    });
  });

  it("submits 'return' decision and shows Returned status", async () => {
    vi.mocked(approveWorkflowStep).mockResolvedValue(decisionResult("Returned"));
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Decision *")).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Return - Team member to provide/));
    fireEvent.click(screen.getByText("Submit Decision"));

    await waitFor(() => {
      expect(approveWorkflowStep).toHaveBeenCalledWith(
        expect.objectContaining({ declarationId: "GHE-2026-1001", decision: "return" })
      );
    });
  });

  it("disables submit button when no decision is selected", async () => {
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Decision *")).toBeInTheDocument());
    const submitBtn = screen.getByText("Submit Decision").closest("button")!;
    expect(submitBtn.disabled).toBe(true);
  });

  it("includes notes in the approveWorkflowStep payload", async () => {
    vi.mocked(approveWorkflowStep).mockResolvedValue(decisionResult("Pending"));
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Decision *")).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Team member travel request approved/));
    fireEvent.change(screen.getByPlaceholderText("Add notes or reasoning..."), { target: { value: "Looks good" } });
    fireEvent.click(screen.getByText("Submit Decision"));

    await waitFor(() => {
      expect(approveWorkflowStep).toHaveBeenCalledWith(
        expect.objectContaining({ declarationId: "GHE-2026-1001", decision: "accept", notes: "Looks good" })
      );
    });
  });

  it("submits 'org' decision type", async () => {
    vi.mocked(approveWorkflowStep).mockResolvedValue(decisionResult("Pending"));
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Decision *")).toBeInTheDocument());

    fireEvent.click(screen.getByText(/organisation pool/i));
    fireEvent.click(screen.getByText("Submit Decision"));

    await waitFor(() => {
      expect(approveWorkflowStep).toHaveBeenCalledWith(
        expect.objectContaining({ declarationId: "GHE-2026-1001", decision: "org" })
      );
    });
  });

  it("submits 'foundation' decision type", async () => {
    vi.mocked(approveWorkflowStep).mockResolvedValue(decisionResult("Pending"));
    vi.mocked(fetchWorkflowInstance).mockResolvedValue(mockUserStep);
    render(<ApprovalDetail declaration={mockDeclaration} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Decision *")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Approved - Travel request approved."));
    fireEvent.click(screen.getByText("Submit Decision"));

    await waitFor(() => {
      expect(approveWorkflowStep).toHaveBeenCalledWith(
        expect.objectContaining({ declarationId: "GHE-2026-1001", decision: "foundation" })
      );
    });
  });
});
