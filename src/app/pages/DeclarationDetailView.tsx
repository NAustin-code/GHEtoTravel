import { useState } from "react";
import { ArrowLeft, Download, Eye, FileText } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { formatRand } from "@/config/theme";
import { Declaration, UploadedFile } from "@/types/declaration";
import { downloadStoredFile } from "@/services/api";

export function DeclarationDetailView({
  data,
  onBack,
  hideBackButton,
  hideDocuments,
}: {
  data: Record<string, string> | Declaration;
  onBack: () => void;
  hideBackButton?: boolean;
  hideDocuments?: boolean;
}) {
  // `data` is always a Declaration from current callers; the casts below tolerate
  // legacy string-record payloads (missing fields render as "—").
  const d = data as Declaration;
  const safe = (v: unknown) => (v != null ? String(v) : "—");
  const cost = (v: unknown) => (typeof v === "number" ? formatRand(v) : safe(v));

  const fields: [string, string][] = [
    ["Company",                safe(d.company)],
    ["Department",             safe(d.department)],
    ["Approving Manager Name", safe(d.lineManager)],
    ["Team Member",            safe(d.employee)],
    ["Team Member Code",       safe(d.teamMemberNumber)],
    ["Team",                   safe(d.team)],
    ["Team Member Role / Position", safe(d.position)],
    ["Travel Type",            safe(d.travelType || d.type)],
    ["Destination",            safe(d.destination || d.counterparty)],
    ["Reason for Travel",      safe(d.reason || d.description)],
    ["Traveling From",         safe(d.from)],
    ["Traveling To",           safe(d.to || d.destination || d.counterparty)],
    ["Date of Departure",      safe(d.departureDate || d.date)],
    ["Date of Return",         safe(d.returnDate)],
    ["Number of Travelers",    safe(d.numberOfPeople ?? d.instances)],
    ["Travelers",              safe(Array.isArray(d.travelers) ? d.travelers.map((t) => t.name).filter(Boolean).join(", ") : undefined)],
    ["Mode of Transport",      safe(d.transportMode)],
    ["Transport Details",      safe(d.transportDetails)],
    ["Flight Cost",            d.flightCost != null ? formatRand(d.flightCost) : "—"],
    ["Seat Preference",        safe(d.seatPreference)],
    ["Accommodation Required", d.accommodationRequired ? "Yes" : "No"],
    ["Accommodation Details",  safe(d.accommodationDetails)],
    ["Accommodation Cost",     d.accommodationCost != null ? formatRand(d.accommodationCost) : "—"],
    ["Company To Be Billed",   safe(d.companyToBeBilled)],
    ["Order Number",           safe(d.orderNumber)],
    ["Total Cost",             cost(d.value)],
    ...(d.substantiation
      ? ([["High-Value Motivation", safe(d.substantiation)]] as [string, string][])
      : []),
  ];

  return (
    <div className="h-full flex flex-col gap-5">
      
      <div className="detail-panel-shell flex-1 min-h-0">
      <Card
        className="
        detail-panel-card
        p-6 rounded-2xl
        bg-white
        border border-white/40
      "
    >

      <div className="relative z-10">
          {!hideBackButton && (
            <button
              onClick={onBack}
              className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold shadow-sm transition-colors hover:bg-muted/50"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <h2 className="mb-6 inline-flex rounded-full border border-teal-200/70 bg-teal-50 px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.2em] text-teal-900 shadow-sm">
            Travel Request Details
          </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(([k, v]) => (
            <div
              key={k}
              className={`
                rounded-xl p-4
                bg-white
                border border-slate-200
                shadow-sm
                ${
                  ["Reason for Travel", "Transport Details", "Accommodation Details", "High-Value Motivation", "Travelers"].includes(k)
                    ? "sm:col-span-2"
                    : ""
                }
              `}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {k}
              </p>

              <p className="mt-2 text-sm font-medium text-slate-800 break-words">
                {v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
    </div>

    {!hideDocuments && <SupportingDocuments data={data} />}
    </div>
  );
}

async function downloadFile(file: UploadedFile, declarationId: string, onError: (msg: string) => void) {
  try {
    const blob = await downloadStoredFile(declarationId, file);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    // Detached-anchor clicks are ignored by Safari — attach first.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (err) {
    onError(err instanceof Error ? err.message : `Could not download ${file.name}.`);
  }
}

async function viewFile(file: UploadedFile, declarationId: string, onError: (msg: string) => void) {
  try {
    const blob = await downloadStoredFile(declarationId, file);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (err) {
    onError(err instanceof Error ? err.message : `Could not open ${file.name}.`);
  }
}

function parseFiles(data: Record<string, string> | Declaration): UploadedFile[] {
  const isRecord = typeof (data as Declaration).value === "number";
  const d = isRecord ? (data as Declaration) : null;
  const record = !d ? (data as Record<string, string>) : null;
  const sourceFiles = d?.files ?? record?.files ?? [];
  return Array.isArray(sourceFiles)
    ? sourceFiles
    : String(sourceFiles)
        .split(",")
        .map((file) => file.trim())
        .filter(Boolean)
        .map((file) => ({ name: file, size: 0, type: "", url: file }));
}

export function SupportingDocuments({ data }: { data: Record<string, string> | Declaration }) {
  const supportingDocuments = parseFiles(data);
  const [fileError, setFileError] = useState("");
  const declarationId = (data as Declaration).id ?? (data as Record<string, string>).id ?? "";
  return (
    <div>
      <div className="detail-panel-shell">
      <Card
        className="
          detail-panel-card
          p-6 rounded-2xl
          bg-white
          border border-white/40
        "
      >

        <div className="relative z-10">
          <h3 className="mb-6 inline-flex rounded-full border border-teal-200/70 bg-teal-50 px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.2em] text-teal-900 shadow-sm">
            Supporting Documents
          </h3>

          <div className="space-y-3">
            {fileError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{fileError}</div>
            )}
            {supportingDocuments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm font-medium text-slate-500">
                No supporting documents were uploaded for this travel request.
              </div>
            ) : (
              supportingDocuments.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                        className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {file.size ? `${(file.size / 1024).toFixed(0)} KB` : "Uploaded document"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => { setFileError(""); viewFile(file, declarationId, setFileError); }}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-100 bg-white px-3 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 sm:flex-none"
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFileError(""); downloadFile(file, declarationId, setFileError); }}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-100 bg-white px-3 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 sm:flex-none"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}


