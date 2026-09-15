import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fetchWorkflowInstance, approveWorkflowStep } from "@/services/api";
import type { WorkflowDecisionResult } from "@/services/api";
import { DECISION_LABELS } from "@/config/theme";
import type { StepView } from "@/app/components/WorkflowTimeline"
import type {
    ApprovalDecision,
    StatusType,
    WorkflowInstance,
    WorkflowStep,
} from "@/types/declaration";

interface UseWorkflowApprovalOptions {
    declarationId: string | null;
    userId: string | null;
    initialWorkflowSteps?: WorkflowStep[];
    onStatusUpdate?: (status: StatusType) => void;
}

export function useWorkflowApproval({ declarationId, userId, initialWorkflowSteps, onStatusUpdate }: UseWorkflowApprovalOptions) {
  const [wfInstance, setWfInstance] = useState<WorkflowInstance | null>(null);
  const [wfLoading, setWfLoading] = useState(!!declarationId);
  const [lmDecision, setLmDecision] = useState<ApprovalDecision>(null);
  const [hrDecision, setHrDecision] = useState<ApprovalDecision>(null);
  const [lmNotes, setLmNotes] = useState("");
  const [hrNotes, setHrNotes] = useState("");
  const [wfMessage, setWfMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadWorkflowInstance = useCallback(async () => {
    if (!declarationId) {
      setWfInstance(null);
      return;
    }
    if (initialWorkflowSteps) {
      setWfInstance({ declarationId, steps: initialWorkflowSteps });
      setSubmitError("");
      setWfLoading(false);
      return;
    }
    setWfLoading(true);
    try {
      const wf = await fetchWorkflowInstance(declarationId);
      setWfInstance(wf);
      if (wf) {
        const getStep = (role: string) => wf.steps.find((s: WorkflowStep) => s.role === role);
        setLmDecision(getStep("lineManager")?.decision ?? null);
        setHrDecision(getStep("hr")?.decision ?? null);
        setLmNotes(getStep("lineManager")?.notes ?? "");
        setHrNotes(getStep("hr")?.notes ?? "");
      }
    } catch {
      setSubmitError("Failed to load workflow instance.");
    } finally {
      setWfLoading(false);
    }
  }, [declarationId, initialWorkflowSteps]);

  useEffect(() => {
    loadWorkflowInstance();
  }, [loadWorkflowInstance]);

  useEffect(() => {
    return () => clearTimeout(messageTimerRef.current);
  }, []);

  const steps = useMemo(() => wfInstance?.steps ?? [], [wfInstance]);
  const lmStep = steps.find((s: WorkflowStep) => s.role === "lineManager");
  const hrStep = steps.find((s: WorkflowStep) => s.role === "hr");

  const hasLm = !!lmStep;
  const hasHr = !!hrStep;
  const isLmApproved = lmStep?.status === "approved";
  const isHrEnabled = hasHr && isLmApproved;

  const lineManagerRole = useMemo(() => ({
    roleKey: "lineManager" as const,
    title: "1. Line Manager Approval",
    defaultActor: "Line Manager",
    get decision() { return lmStep?.status !== "pending" ? (lmStep?.decision ?? null) : lmDecision; },
    setDecision: setLmDecision,
    get notes() { return lmNotes; },
    setNotes: setLmNotes,
    get step() { return lmStep; },
    get exists() { return hasLm; },
    get enabled() { return lmStep?.status === "pending"; },
    get completed() { return !!lmStep && lmStep.status !== "pending"; },
    get decidedAt() { return lmStep?.decidedAt || null; },
  }), [lmStep, lmDecision, lmNotes, hasLm]);

  const hrRole = useMemo(() => ({
    roleKey: "hr" as const,
    title: "2. Head of HR Approval",
    defaultActor: "Head of HR",
    get decision() { return hrStep?.status !== "pending" ? (hrStep?.decision ?? null) : hrDecision; },
    setDecision: setHrDecision,
    get notes() { return hrNotes; },
    setNotes: setHrNotes,
    get step() { return hrStep; },
    get exists() { return hasHr; },
    get enabled() { return isHrEnabled && hrStep?.status === "pending"; },
    get completed() { return !!hrStep && hrStep.status !== "pending"; },
    get decidedAt() { return hrStep?.decidedAt || null; },
  }), [hrStep, hrDecision, hrNotes, hasHr, isLmApproved]);

  const allRoles = useMemo(() => [lineManagerRole, hrRole], [lineManagerRole, hrRole]);

  const wfSteps: StepView[] = useMemo(() => {
    let hasTerminal = false;
    return allRoles.map((r) => {
    if (!r.exists) return { label: r.title, actor: r.defaultActor, state: "skipped" };
    const decided = r.completed;
    const state = hasTerminal ? "skipped" : decided ? "completed" : r.enabled ? "active" : "pending";
    const view = {
      label: r.title,
      actor: r.step?.assigneeName || r.defaultActor,
      state: state as StepView["state"],
      decision: r.decision ? { label: DECISION_LABELS[r.decision] || r.decision } : null,
      decidedAt: r.decidedAt,
      notes: r.notes,
    };
    if (decided && r.decision && ["return", "decline"].includes(r.decision)) hasTerminal = true;
    return view;
  });
  }, [allRoles]);

  // A step is actionable once every predecessor is approved. "skipped" is
  // accepted defensively for forward-compatibility; the local store only
  // emits pending/approved/declined/returned.
  const currentUserStep = useMemo(() => steps.find(
    (s: WorkflowStep, i: number) => s.status === "pending" && steps.slice(0, i).every((p: WorkflowStep) => p.status === "approved" || p.status === "skipped")
  ), [steps]);
  const canApprove = currentUserStep?.assignee === userId;
  const currentUserStepRole = canApprove ? currentUserStep?.role : undefined;
  const activeRole = useMemo(() => allRoles.find((r) => r.enabled && r.roleKey === currentUserStepRole), [allRoles, currentUserStepRole]);

  const decisionsByRole: Record<string, ApprovalDecision> = { lineManager: lmDecision, hr: hrDecision };
  const notesByRole: Record<string, string> = { lineManager: lmNotes, hr: hrNotes };

  const handleSubmit = async () => {
    if (!userId || !wfInstance || !currentUserStep || isSubmitting) return;
    setSubmitError("");
    const decision = decisionsByRole[currentUserStep.role];
    const notes = notesByRole[currentUserStep.role];
    if (!decision) return;
    setIsSubmitting(true);
    try {
      if (!declarationId) return;
      const res: WorkflowDecisionResult | undefined = await approveWorkflowStep({ declarationId, decision, notes });
      if (res?.newStatus) onStatusUpdate?.(res.newStatus);
      // 204 returns undefined — rely on re-fetched state for status
      await loadWorkflowInstance();
      setWfMessage("Decision submitted successfully.");
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => { setWfMessage(""); }, 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred while submitting the decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    wfSteps, wfMessage, wfLoading, canApprove, submitError,
    activeDecision: activeRole?.decision as ApprovalDecision | undefined,
    setActiveDecision: activeRole?.setDecision as ((d: ApprovalDecision) => void) | undefined,
    activeNotes: activeRole?.notes || "",
    setActiveNotes: activeRole?.setNotes as ((v: string) => void) | undefined,
    handleSubmit,
    submitDisabled: !activeRole?.decision || isSubmitting,
    isSubmitting,
  };
}
