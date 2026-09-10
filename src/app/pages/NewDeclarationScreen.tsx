import React, { useState, useEffect } from "react";
import { Upload, Trash2, Paperclip } from "lucide-react";
import { Sel } from "@/app/components/Sel";
import { FL } from "@/app/components/FL";
import { FS } from "@/app/components/FS";
import { inp } from "@/config/theme";
import { Declaration, Traveler, TransportMode, UploadedFile } from "@/types/declaration";
import {
  createDeclaration,
  submitDeclaration,
  updateDeclaration,
  uploadDeclarationFile,
  fetchConfig,
  fetchDropdowns,
  fetchUserById,
  fetchOrganizations,
} from "@/services/api";
import { useUser } from "@/app/auth/UserContext";

const GENDER_OPTIONS = ["Male", "Female"];
const SEAT_PREFERENCE_OPTIONS = ["Aisle", "Window", "Other"];
const FIRST_TIME_FLYING_OPTIONS = ["Yes", "No"];
const TRAVEL_TYPE_OPTIONS = ["Domestic", "International"];
const TRANSPORT_OPTIONS: TransportMode[] = ["None", "Flight", "Bus", "Train", "Car", "Other"];

const BILLED_COMPANIES = [
  "THE STAR MERCHANT (PTY) LTD",
  "RACING DISTRIBUTION (PTY) LTD",
  "LIMPOPO PTY LTD",
  "KWA-ZULU NATAL (PTY)LTD",
  "MPUMALANGA (PTY) LTD",
  "FREE STATE (PTY)LTD",
  "GAUTENG (PTY)LTD",
  "EASTERN CAPE (PTY)LTD",
  "WESTERN CAPE (PTY)LTD",
  "HOLLYWOOD SPORTSBOOK HOLDINGS (PTY) LTD",
  "SPLASHOUT (PTY) LTD",
  "HOLLYWOOD FOUNDATION NPC",
  "RACE COAST HOLDING (PTY) LTD",
  "RACE COAST KZN (PTY) LTD",
  "MOZAMBIQUE LDA",
  "BGS",
  "HOLLYWOOD ATLETIC CLUB",
  "BET SOFTWARE (PTY) LTD",
  "BONNE GARDE SUPPORT (PTY) LTD",
  "STAR BAR AND CAFE MPUMALANGA (PTY) LTD",
  "STAR BAR AND CAFE",
  "THE STAR FACTORY (PROPRIETARY) LIMITED",
  "RACE COAST WESTERN CAPE (PTY) LTD",
];

interface TravelFormState {
  company: string;
  organizationId: string;
  lineManager: string;
  companyToBeBilled: string;
  department: string;
  orderNumber: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelType: "Domestic" | "International";
  reason: string;
  from: string;
  to: string;
  transportMode: TransportMode;
  transportDetails: string;
  flightCost: string;
  seatPreference: "Aisle" | "Window" | "Other";
  firstTimeFlying: "Yes" | "No";
  accommodationRequired: boolean;
  accommodationDetails: string;
  accommodationCost: string;
  enterTravellerDetails: boolean;
}

const EMPTY_FORM: TravelFormState = {
  company: "",
  organizationId: "",
  lineManager: "",
  companyToBeBilled: "",
  department: "",
  orderNumber: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  travelType: "Domestic",
  reason: "",
  from: "",
  to: "",
  transportMode: "None",
  transportDetails: "",
  flightCost: "",
  seatPreference: "Aisle",
  firstTimeFlying: "No",
  accommodationRequired: false,
  accommodationDetails: "",
  accommodationCost: "",
  enterTravellerDetails: false,
};

function blankTraveler(index: number): Traveler {
  return {
    id: `traveller-${index}`,
    name: "",
    teamMemberNumber: "",
    department: "",
    position: "",
    idDocument: "",
    idDocumentType: "ID",
    email: "",
    cellPhone: "",
    jobTitle: "",
    company: "",
    gender: "Male",
  };
}

export function NewDeclarationScreen({
  onSubmitSuccess,
  onDraftSaved,
  draft,
}: {
  onSubmitSuccess: (data: Declaration) => void;
  onDraftSaved: () => void;
  draft?: Declaration | null;
}) {
  const { user } = useUser();
  const [formState, setFormState] = useState<TravelFormState>(EMPTY_FORM);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [travelers, setTravelers] = useState<Traveler[]>([blankTraveler(0)]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string; shortCode: string }[]>([]);
  const [lineManagerName, setLineManagerName] = useState("");
  const [config, setConfig] = useState({ highValueThreshold: 5000, mediumValueThreshold: 1000 });
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  // Deliberately not restored from drafts: the undertaking must be re-confirmed on every submit.
  const [agreed, setAgreed] = useState(false);

  const set = <K extends keyof TravelFormState>(key: K, value: TravelFormState[K]) =>
    setFormState((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    fetchConfig()
      .then((c) => {
        setConfig({
          highValueThreshold: Number(c?.highValueThreshold) || 5000,
          mediumValueThreshold: Number(c?.mediumValueThreshold) || 1000,
        });
      })
      .catch(() => {});
    fetchDropdowns().then((d) => setDepartments(d.departments || [])).catch(() => {});
    fetchOrganizations().then(setOrganizations).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (user?.lineManager) {
      fetchUserById(user.lineManager)
        .then((u) => {
          if (!cancelled) setLineManagerName(u?.name || "");
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (organizations.length > 0 && !formState.company) {
      const userOrg = organizations.find((o) => o.id === user?.organizationId);
      const first = userOrg || organizations[0];
      if (first) {
        setFormState((f) => ({ ...f, company: first.name, organizationId: first.id }));
      }
    }
  }, [organizations, user?.organizationId, formState.company]);

  useEffect(() => {
    if (lineManagerName && !formState.lineManager) {
      setFormState((f) => ({ ...f, lineManager: lineManagerName }));
    }
  }, [lineManagerName, formState.lineManager]);

  useEffect(() => {
    if (!draft) return;
    setFormState({
      company: draft.company || "",
      organizationId: draft.organizationId || "",
      lineManager: draft.lineManager || "",
      companyToBeBilled: draft.companyToBeBilled ?? "",
      department: draft.department || "",
      orderNumber: draft.orderNumber ?? "",
      destination: draft.destination || draft.counterparty || "",
      departureDate: draft.departureDate || "",
      returnDate: draft.returnDate || "",
      travelType: draft.travelType || "Domestic",
      reason: draft.reason || draft.description || "",
      from: draft.from || "",
      to: draft.to || "",
      transportMode: draft.transportMode || "None",
      transportDetails: draft.transportDetails || "",
      flightCost: draft.flightCost != null ? String(draft.flightCost) : "",
      seatPreference: draft.seatPreference || "Aisle",
      firstTimeFlying: draft.firstTimeFlying === true || draft.firstTimeFlying === "Yes" ? "Yes" : "No",
      accommodationRequired: draft.accommodationRequired || false,
      accommodationDetails: draft.accommodationDetails || "",
      accommodationCost: draft.accommodationCost != null ? String(draft.accommodationCost) : "",
      enterTravellerDetails: draft.enterTravellerDetails || false,
    });
    const saved = draft.travelers && draft.travelers.length > 0 ? draft.travelers : [blankTraveler(0)];
    setTravelers(saved);
    setNumberOfPeople(draft.numberOfPeople || saved.length || 1);
    setSavedId(draft.id || null);
    setFiles(draft.files || []);
    setPendingFiles([]);
    setFileError("");
    setErrors({});
    setSubmitError("");
  }, [draft]);

  const updateTraveler = (index: number, patch: Partial<Traveler>) =>
    setTravelers((list) => list.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const handleNumberOfPeople = (n: number) => {
    const clamped = Math.min(10, Math.max(1, n || 1));
    setNumberOfPeople(clamped);
    setTravelers((list) => {
      if (list.length === clamped) return list;
      if (list.length > clamped) return list.slice(0, clamped);
      return [...list, ...Array.from({ length: clamped - list.length }, (_, k) => blankTraveler(list.length + k))];
    });
  };

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!formState.destination.trim()) next.destination = "Destination is required";
    if (!formState.departureDate) next.departureDate = "Departure date is required";
    if (!formState.returnDate) next.returnDate = "Return date is required";
    if (!formState.reason.trim()) next.reason = "Reason for travel is required";
    if (formState.departureDate && formState.returnDate && formState.returnDate < formState.departureDate) {
      next.returnDate = "Return date cannot be before departure date";
    }
    travelers.slice(0, numberOfPeople).forEach((t, i) => {
      if (!t.name.trim()) next[`traveler-name-${i}`] = "Traveler name is required";
      if (!t.email.trim()) next[`traveler-email-${i}`] = "Traveler email is required";
      else if (!EMAIL_PATTERN.test(t.email.trim())) next[`traveler-email-${i}`] = "Enter a valid email address";
      if (!t.cellPhone.trim()) next[`traveler-phone-${i}`] = "Traveler cell phone is required";
      else if (t.cellPhone.replace(/\D/g, "").length < 9) next[`traveler-phone-${i}`] = "Enter a valid cell number (at least 9 digits)";
      if (!t.idDocument.trim()) next[`traveler-id-${i}`] = "ID / passport number is required";
      else if (t.idDocument.trim().length < 5) next[`traveler-id-${i}`] = "ID / passport number looks too short";
    });
    if (!agreed) next.agreed = "Please confirm the declaration before submitting";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildDeclaration = (status: "Draft" | "Pending", idOverride?: string, uploadedFiles?: UploadedFile[]): Declaration => {
    const flight = Number(formState.flightCost) || 0;
    const stay = Number(formState.accommodationCost) || 0;
    const active = travelers.slice(0, numberOfPeople);
    const total = flight + stay;
    const base: Omit<Declaration, "id" | "travelers" | "numberOfPeople" | "files"> = {
      employee: user?.name || draft?.employee || "Employee",
      employeeId: user?.id || draft?.employeeId || "user-1",
      teamMemberNumber: user?.teamMemberNumber || draft?.teamMemberNumber || "",
      lineManager: formState.lineManager || lineManagerName,
      position: user?.position || draft?.position || "",
      department: formState.department || user?.department || draft?.department || "",
      company: formState.company,
      companyToBeBilled: formState.companyToBeBilled || undefined,
      orderNumber: formState.orderNumber || undefined,
      organizationId: formState.organizationId || user?.organizationId,
      type: formState.travelType,
      counterparty: formState.destination,
      value: total,
      submitted: new Date().toISOString(),
      approver: formState.lineManager || lineManagerName || draft?.approver || "",
      status,
      priority: total >= config.highValueThreshold ? "High" : total >= config.mediumValueThreshold ? "Medium" : "Low",
      description: formState.reason,
      relationship: `${formState.from} → ${formState.to}`.trim(),
      receivedGiven: "",
      from: formState.from,
      contactPerson: active[0]?.name || "",
      biddingProcess: "",
      occasion: formState.reason,
      date: formState.departureDate,
      publicOfficial: "",
      files: uploadedFiles ?? [],
    };
    return {
      ...base,
      id: idOverride || draft?.id || savedId || `TR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`,
      travelers: active,
      numberOfPeople,
      destination: formState.destination,
      departureDate: formState.departureDate,
      returnDate: formState.returnDate,
      travelType: formState.travelType,
      reason: formState.reason,
      to: formState.to,
      transportMode: formState.transportMode,
      transportDetails: formState.transportDetails,
      flightCost: flight || undefined,
      seatPreference: formState.seatPreference,
      firstTimeFlying: formState.firstTimeFlying,
      accommodationRequired: formState.accommodationRequired,
      accommodationDetails: formState.accommodationDetails,
      accommodationCost: stay || undefined,
      enterTravellerDetails: formState.enterTravellerDetails,
    };
  };

  const resetForm = () => {
    setFormState(EMPTY_FORM);
    setTravelers([blankTraveler(0)]);
    setNumberOfPeople(1);
    setSavedId(null);
    setFiles([]);
    setPendingFiles([]);
    setFileError("");
    setAgreed(false);
    setErrors({});
    setSubmitError("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setSaving(true);
    try {
      const created = await createDeclaration(buildDeclaration("Draft"));
      const uploaded = await flushPendingFiles(created.id);
      const withFiles = uploaded.length > 0
        ? await updateDeclaration(created.id, { files: [...(created.files || []), ...uploaded] })
        : created;
      const submitted = await submitDeclaration(withFiles.id);
      setSavedId(null);
      resetForm();
      onSubmitSuccess(submitted);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  };

const onDraftSave = async () => {
    setSubmitError("");
    setSaving(true);
    try {
      const saved = await createDeclaration(buildDeclaration("Draft"));
      const uploaded = await flushPendingFiles(saved.id);
      const withFiles = uploaded.length > 0
        ? await updateDeclaration(saved.id, { files: [...(saved.files || []), ...uploaded] })
        : saved;
      setSavedId(withFiles.id);
      setFiles(withFiles.files || []);
      setPendingFiles([]);
      onDraftSaved();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Saving draft failed");
    } finally {
      setSaving(false);
    }
  };

  const err = (field: string) => errors[field] || "";

  const ACCEPTED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "docx"];
  const MAX_FILE_BYTES = 20 * 1024 * 1024;

  // Files are only staged here; nothing is uploaded until save/submit, so
  // abandoned forms leave no orphaned file records behind.
  const handleFiles = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setFileError("");
    const staged: File[] = [];
    for (const file of Array.from(selected)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setFileError(`Unsupported file type: ${file.name}. Use PDF, PNG, JPG or DOCX.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${file.name} exceeds the 20 MB limit.`);
        continue;
      }
      staged.push(file);
    }
    if (staged.length > 0) setPendingFiles((prev) => [...prev, ...staged]);
  };

  const flushPendingFiles = async (declarationId: string): Promise<UploadedFile[]> => {
    const uploaded: UploadedFile[] = [];
    for (const file of pendingFiles) {
      try {
        uploaded.push(await uploadDeclarationFile(file, declarationId));
      } catch (uploadErr: unknown) {
        throw new Error(uploadErr instanceof Error ? uploadErr.message : `Could not upload ${file.name}`);
      }
    }
    return uploaded;
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const removePendingFile = (index: number) => setPendingFiles((prev) => prev.filter((_, i) => i !== index));

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-7">
      <div>
        <h2 className="text-xl font-bold text-foreground">New Travel Request</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Capture traveler details, travel itinerary, transport and accommodation for approval.
        </p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
      )}

      <FS id="sec-traveler" num="1" title="Traveler Details">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <FL required error={err("numberOfPeople")}>
              Number of People Travelling
            </FL>
            <Sel value={String(numberOfPeople)} onChange={(v) => handleNumberOfPeople(Number(v))}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </Sel>
          </div>
          <div>
            <FL>Company</FL>
            <input
              className={inp}
              value={formState.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Company traveler falls under"
            />
          </div>
          <div>
            <FL>Company To Be Billed</FL>
            <Sel value={formState.companyToBeBilled} onChange={(v) => set("companyToBeBilled", v)}>
              <option value="">Select company</option>
              {BILLED_COMPANIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Sel>
          </div>
          <div>
            <FL>Department Team Member Falls Under</FL>
            <input
              className={inp}
              value={formState.department}
              onChange={(e) => set("department", e.target.value)}
              placeholder="e.g. Finance"
              list="travel-departments"
            />
            <datalist id="travel-departments">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <FL>Name of Approval Manager</FL>
            <input
              className={inp}
              value={formState.lineManager}
              onChange={(e) => set("lineManager", e.target.value)}
              placeholder="Approving manager"
            />
          </div>
          <div>
            <FL>Order Number</FL>
            <input
              className={inp}
              value={formState.orderNumber}
              onChange={(e) => set("orderNumber", e.target.value)}
              placeholder="Order number (if known)"
            />
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {travelers.slice(0, numberOfPeople).map((t, i) => (
            <div key={`${t.id}-${i}`} className="rounded-xl border border-border p-4">
              <p className="text-sm font-bold text-foreground mb-3">Traveler {i + 1}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
                  <FL required error={err(`traveler-name-${i}`)}>
                    Name (As Per ID/Passport)
                  </FL>
                  <input
                    className={`${inp} ${err(`traveler-name-${i}`) ? "border-red-500 bg-red-50" : ""}`}
                    value={t.name}
                    onChange={(e) => updateTraveler(i, { name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <FL required error={err(`traveler-id-${i}`)}>
                    ID / Passport No
                  </FL>
                  <input
                    className={`${inp} ${err(`traveler-id-${i}`) ? "border-red-500 bg-red-50" : ""}`}
                    value={t.idDocument}
                    onChange={(e) => updateTraveler(i, { idDocument: e.target.value })}
                    placeholder="ID or passport number"
                  />
                </div>
                <div>
                  <FL>Gender</FL>
                  <Sel value={t.gender || "Male"} onChange={(v) => updateTraveler(i, { gender: v })}>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Sel>
                </div>
                <div>
                  <FL required error={err(`traveler-email-${i}`)}>
                    Email Address
                  </FL>
                  <input
                    className={`${inp} ${err(`traveler-email-${i}`) ? "border-red-500 bg-red-50" : ""}`}
                    value={t.email}
                    onChange={(e) => updateTraveler(i, { email: e.target.value })}
                    placeholder="name@company.co.za"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <FL required error={err(`traveler-phone-${i}`)}>
                    Cell Number
                  </FL>
                  <input
                    className={`${inp} ${err(`traveler-phone-${i}`) ? "border-red-500 bg-red-50" : ""}`}
                    value={t.cellPhone}
                    onChange={(e) => updateTraveler(i, { cellPhone: e.target.value })}
                    placeholder="082 000 0000"
                  />
                </div>
                <div>
                  <FL>Job Title</FL>
                  <input
                    className={inp}
                    value={t.jobTitle}
                    onChange={(e) => updateTraveler(i, { jobTitle: e.target.value })}
                    placeholder="Job title"
                  />
                </div>
                <div>
                  <FL>Employee Code</FL>
                  <input
                    className={inp}
                    value={t.teamMemberNumber}
                    onChange={(e) => updateTraveler(i, { teamMemberNumber: e.target.value })}
                    placeholder="Employee code"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </FS>

      <FS id="sec-travel" num="2" title="Travel Details">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <FL required error={err("departureDate")}>
              Date Of Departure
            </FL>
            <input
              type="date"
              className={`${inp} ${err("departureDate") ? "border-red-500 bg-red-50" : ""}`}
              value={formState.departureDate}
              onChange={(e) => set("departureDate", e.target.value)}
            />
          </div>
          <div>
            <FL required error={err("returnDate")}>
              Date Of Return
            </FL>
            <input
              type="date"
              className={`${inp} ${err("returnDate") ? "border-red-500 bg-red-50" : ""}`}
              value={formState.returnDate}
              onChange={(e) => set("returnDate", e.target.value)}
            />
          </div>
          <div>
            <FL required>Travel Type</FL>
            <Sel value={formState.travelType} onChange={(v) => set("travelType", v as "Domestic" | "International")}>
              {TRAVEL_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Sel>
          </div>
          <div className="md:col-span-3">
            <FL required error={err("reason")}>
              Reason For Travel
            </FL>
            <input
              className={`${inp} ${err("reason") ? "border-red-500 bg-red-50" : ""}`}
              value={formState.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Purpose of the trip"
            />
          </div>
          <div>
            <FL>Where Are You Traveling From</FL>
            <input
              className={inp}
              value={formState.from}
              onChange={(e) => set("from", e.target.value)}
              placeholder="Departure city"
            />
          </div>
          <div>
            <FL>Where Are You Traveling To</FL>
            <input
              className={inp}
              value={formState.to}
              onChange={(e) => set("to", e.target.value)}
              placeholder="Destination city"
            />
          </div>
          <div>
            <FL required error={err("destination")}>
              Destination
            </FL>
            <input
              className={`${inp} ${err("destination") ? "border-red-500 bg-red-50" : ""}`}
              value={formState.destination}
              onChange={(e) => set("destination", e.target.value)}
              placeholder="Destination"
            />
          </div>
          <div>
            <FL>Mode Of Transport</FL>
            <Sel value={formState.transportMode} onChange={(v) => set("transportMode", v as TransportMode)}>
              {TRANSPORT_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Sel>
          </div>
          <div>
            <FL>Transport Details</FL>
            <input
              className={inp}
              value={formState.transportDetails}
              onChange={(e) => set("transportDetails", e.target.value)}
              placeholder="Flight / bus details"
            />
          </div>
          <div>
            <FL>Flight Cost (R)</FL>
            <input
              type="number"
              min="0"
              className={inp}
              value={formState.flightCost}
              onChange={(e) => set("flightCost", e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <FL>Seat Preference</FL>
            <Sel
              value={formState.seatPreference}
              onChange={(v) => set("seatPreference", v as "Aisle" | "Window" | "Other")}
            >
              {SEAT_PREFERENCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Sel>
          </div>
          <div>
            <FL>Is this your first time flying?</FL>
            <Sel value={formState.firstTimeFlying} onChange={(v) => set("firstTimeFlying", v as "Yes" | "No")}>
              {FIRST_TIME_FLYING_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Sel>
          </div>
          <div className="flex items-end gap-2 pb-1">
            <input
              id="enter-traveller-details"
              type="checkbox"
              checked={formState.enterTravellerDetails}
              onChange={(e) => set("enterTravellerDetails", e.target.checked)}
              className="h-5 w-5 rounded border border-slate-300"
            />
            <label htmlFor="enter-traveller-details" className="text-sm font-medium text-foreground">
              Enter Traveller&apos;s Details
            </label>
          </div>
        </div>
      </FS>

      <FS id="sec-accommodation" num="3" title="Accommodation & Transport">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <FL>Car Hire Required</FL>
            <Sel
              value={formState.transportMode === "Car" ? "Yes" : "No"}
              onChange={(v) => set("transportMode", v === "Yes" ? "Car" : "None")}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </Sel>
          </div>
          <div className="md:col-span-2">
            <FL>Car Hire Details</FL>
            <input
              className={inp}
              value={formState.transportMode === "Car" ? formState.transportDetails : ""}
              onChange={(e) => {
                set("transportDetails", e.target.value);
                if (e.target.value) set("transportMode", "Car");
              }}
              placeholder="Car hire requirements"
            />
          </div>
          <div>
            <FL>Accommodation Required</FL>
            <Sel value={formState.accommodationRequired ? "Yes" : "No"} onChange={(v) => set("accommodationRequired", v === "Yes")}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </Sel>
          </div>
          <div>
            <FL>Accommodation Cost (R)</FL>
            <input
              type="number"
              min="0"
              className={inp}
              value={formState.accommodationCost}
              onChange={(e) => set("accommodationCost", e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <FL>Accommodation Details</FL>
            <input
              className={inp}
              value={formState.accommodationDetails}
              onChange={(e) => set("accommodationDetails", e.target.value)}
              placeholder="Hotel / guesthouse details"
            />
          </div>
        </div>
      </FS>

      <FS id="sec-docs" num="4" title="Supporting Documents">
        <FL hint="Quotes, itineraries or invoices. PDF, PNG, JPG or DOCX up to 20 MB each.">
          Attach supporting documents
        </FL>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-teal-500 hover:text-foreground">
          <Upload size={16} />
          Click to upload or drag files here
          <input
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        {fileError && <p className="text-[11px] text-red-500 mt-1.5">{fileError}</p>}
        {(files.length > 0 || pendingFiles.length > 0) && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={`saved-${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip size={14} className="flex-shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium text-foreground">{f.name}</span>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {f.size ? `${(f.size / 1024).toFixed(0)} KB` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${f.name}`}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            {pendingFiles.map((f, i) => (
              <li key={`pending-${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip size={14} className="flex-shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium text-foreground">{f.name}</span>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {(f.size / 1024).toFixed(0)} KB · uploads on save
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removePendingFile(i)}
                  aria-label={`Remove ${f.name}`}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </FS>

      <FS id="sec-undertaking" num="5" title="Travel Declaration & Undertaking">
        <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
          <li>I confirm that the travel details provided are true and correct.</li>
          <li>I understand that travel bookings must follow company policy and approved budgets.</li>
          <li>I agree to submit proof of travel and receipts where required.</li>
        </ul>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border border-slate-300"
          />
          <span>
            I confirm the information above is correct and I accept the travel policy conditions.
            <span className="text-red-500 font-bold"> *</span>
          </span>
        </label>
        {err("agreed") && <p className="text-[11px] text-red-500 mt-1.5">{err("agreed")}</p>}
      </FS>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDraftSave}
          disabled={saving}
          className="rounded-xl border border-primary/30 bg-white px-6 py-2.5 text-sm font-semibold text-primary hover:bg-muted disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-teal-600 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Submitting…" : "Submit Travel Request"}
        </button>
      </div>
    </form>
  );
}
