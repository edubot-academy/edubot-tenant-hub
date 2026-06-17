import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Calendar, CheckCircle2, Clock, User, X } from "lucide-react";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import {
  useTrialRequests,
  useUpdateTrialRequest,
  useCreateTrialRequest,
  type TrialRequestRecord,
  type TrialRequestStatus,
} from "@/lib/lms-core-api";

export const Route = createFileRoute("/trial-requests")({
  head: () => ({ meta: [{ title: "QuestLMS — Trial Requests" }] }),
  component: TrialRequestsPage,
});

const STATUS_META: Record<TrialRequestStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200" },
  approved: { label: "Approved", color: "text-green-600 bg-green-50 border-green-200" },
  rejected: { label: "Rejected", color: "text-red-600 bg-red-50 border-red-200" },
  completed: { label: "Completed", color: "text-blue-600 bg-blue-50 border-blue-200" },
};

function TrialRequestsPage() {
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TrialRequestRecord | null>(null);

  const listQuery = useTrialRequests(statusFilter === "all" ? undefined : statusFilter);
  const updateMutation = useUpdateTrialRequest();
  const createMutation = useCreateTrialRequest();

  const requests = listQuery.data?.items ?? [];

  return (
    <DashboardShell>
      <TopBar title="Trial Requests" subtitle="Manage 1-on-1 trial session requests" showStreak={false} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {(["all", "pending", "approved", "rejected", "completed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wide transition ${
              statusFilter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            {s === "all" ? "All" : STATUS_META[s as TrialRequestStatus]?.label ?? s}
          </button>
        ))}
        <button
          onClick={() => setNewFormOpen(true)}
          className="ml-auto rounded-xl border-2 border-primary bg-primary px-4 py-2 text-sm font-black text-primary-foreground hover:opacity-90"
        >
          + New Request
        </button>
      </div>

      {listQuery.isLoading ? (
        <div className="text-sm text-foreground/50 py-8 text-center">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center text-sm text-foreground/50">
          No trial requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const meta = STATUS_META[req.status] ?? STATUS_META.pending;
            return (
              <div
                key={req.id}
                className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow cursor-pointer hover:border-primary/50 transition"
                onClick={() => setSelectedRequest(req)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-foreground/50" />
                        <span className="font-black text-sm">{req.studentName}</span>
                      </div>
                      <span className="text-xs text-foreground/50">{req.studentEmail}</span>
                      {req.parentName && (
                        <span className="text-xs text-foreground/50">· Parent: {req.parentName}</span>
                      )}
                    </div>
                    {req.preferredDate && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                        <Calendar className="size-3" />
                        Preferred: {new Date(req.preferredDate).toLocaleDateString()}
                      </div>
                    )}
                    {req.message && (
                      <p className="text-xs text-foreground/60 line-clamp-2">{req.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-foreground/40">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {req.scheduledAt && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-bold">
                    <CheckCircle2 className="size-3" />
                    Scheduled: {new Date(req.scheduledAt).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New request form dialog */}
      {newFormOpen && (
        <NewRequestDialog
          onClose={() => setNewFormOpen(false)}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
            setNewFormOpen(false);
          }}
          loading={createMutation.isPending}
        />
      )}

      {/* Edit/approve dialog */}
      {selectedRequest && (
        <EditRequestDialog
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={async (patch) => {
            await updateMutation.mutateAsync({ id: selectedRequest.id, patch });
            setSelectedRequest(null);
          }}
          loading={updateMutation.isPending}
        />
      )}
    </DashboardShell>
  );
}

function NewRequestDialog({ onClose, onSubmit, loading }: {
  onClose: () => void;
  onSubmit: (data: { studentName: string; studentEmail: string; parentName?: string; preferredDate?: string; message?: string }) => Promise<void>;
  loading: boolean;
}) {
  const [form, setForm] = useState({ studentName: "", studentEmail: "", parentName: "", preferredDate: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      studentName: form.studentName,
      studentEmail: form.studentEmail,
      parentName: form.parentName || undefined,
      preferredDate: form.preferredDate || undefined,
      message: form.message || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">New Trial Request</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Student name *" value={form.studentName} onChange={(v) => setForm((f) => ({ ...f, studentName: v }))} required />
          <Field label="Student email *" type="email" value={form.studentEmail} onChange={(v) => setForm((f) => ({ ...f, studentEmail: v }))} required />
          <Field label="Parent name" value={form.parentName} onChange={(v) => setForm((f) => ({ ...f, parentName: v }))} />
          <Field label="Preferred date" type="datetime-local" value={form.preferredDate} onChange={(v) => setForm((f) => ({ ...f, preferredDate: v }))} />
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-foreground/50 block mb-1.5">Message</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-black hover:bg-muted">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-black hover:opacity-90 disabled:opacity-50">
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRequestDialog({ request, onClose, onUpdate, loading }: {
  request: TrialRequestRecord;
  onClose: () => void;
  onUpdate: (patch: { status?: TrialRequestStatus; adminNotes?: string; scheduledAt?: string }) => Promise<void>;
  loading: boolean;
}) {
  const [status, setStatus] = useState<TrialRequestStatus>(request.status);
  const [adminNotes, setAdminNotes] = useState(request.adminNotes ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    request.scheduledAt ? new Date(request.scheduledAt).toISOString().slice(0, 16) : ""
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({ status, adminNotes: adminNotes || undefined, scheduledAt: scheduledAt || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 chunky-shadow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">Review Request</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted"><X className="size-4" /></button>
        </div>

        <div className="rounded-2xl border-2 border-border bg-muted/30 p-4 mb-4 space-y-1 text-sm">
          <p><span className="font-bold">Student:</span> {request.studentName} ({request.studentEmail})</p>
          {request.parentName && <p><span className="font-bold">Parent:</span> {request.parentName}</p>}
          {request.preferredDate && <p><span className="font-bold">Preferred:</span> {new Date(request.preferredDate).toLocaleString()}</p>}
          {request.message && <p className="text-foreground/60 mt-2">{request.message}</p>}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-foreground/50 block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TrialRequestStatus)}
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              {(["pending", "approved", "rejected", "completed"] as const).map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
          <Field label="Schedule date/time" type="datetime-local" value={scheduledAt} onChange={setScheduledAt} />
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-foreground/50 block mb-1.5">Admin notes</label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-black hover:bg-muted">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-black hover:opacity-90 disabled:opacity-50">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-wide text-foreground/50 block mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}
