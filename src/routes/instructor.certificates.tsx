import { Link, createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  Pen,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { CertificateDownloadModal } from "@/components/certificates/CertificateDownloadModal";
import { SignaturePad } from "@/components/certificates/SignaturePad";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { normalizeSignatureUpload } from "@/lib/certificate-signature";
import { useInstructorCourses, type TenantCourseRecord } from "@/lib/lms-core-api";
import {
  fetchCertificatePreviewHtml,
  downloadCertificatePdf,
  useCourseCertificates,
  useApproveCertificate,
  useRejectCertificate,
  useUploadCertificateSignature,
  type CertificateRecord,
  type CertificateStatus,
} from "@/lib/certificates-api";

export const Route = createFileRoute("/instructor/certificates")({
  head: () => ({ meta: [{ title: "Student Certificates" }] }),
  component: InstructorCertificatesPage,
});

type StatusFilter = "all" | "pending_approval" | "issued" | "rejected" | "revoked";
const STATUS_FILTERS: StatusFilter[] = ["all", "pending_approval", "issued", "rejected", "revoked"];

function InstructorCertificatesPage() {
  const { context } = useAppContext();
  if (!isBackendApiEnabled() || context.mode !== "backend") {
    return <PrototypePage />;
  }
  return <BackendPage />;
}

function BackendPage() {
  const { t } = useTranslation();
  const [courseId, setCourseId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  const coursesQuery = useInstructorCourses();
  const courses: TenantCourseRecord[] = coursesQuery.data?.items ?? [];

  const allCertsQuery = useCourseCertificates(courseId, { limit: 500 });
  const filteredCertsQuery = useCourseCertificates(
    statusFilter === "all" ? null : courseId,
    statusFilter === "all" ? undefined : { status: statusFilter, limit: 100 },
  );
  const certs = statusFilter === "all" ? (allCertsQuery.data?.items ?? []) : (filteredCertsQuery.data?.items ?? []);
  const allCerts = allCertsQuery.data?.items ?? [];
  const stats = {
    issued: allCerts.filter((item) => item.status === "issued").length,
    pending: allCerts.filter((item) => item.status === "pending_approval").length,
    rejected: allCerts.filter((item) => item.status === "rejected").length,
    revoked: allCerts.filter((item) => item.status === "revoked").length,
  };
  const activeCertsQuery = statusFilter === "all" ? allCertsQuery : filteredCertsQuery;

  const approveMutation = useApproveCertificate();
  const rejectMutation = useRejectCertificate();
  const signatureMutation = useUploadCertificateSignature();
  const sigInputRef = useRef<HTMLInputElement>(null);

  async function handleApprove(cert: CertificateRecord, studentFullName?: string) {
    try {
      await approveMutation.mutateAsync({ certificateId: cert.id, courseId: cert.courseId, studentFullName });
      toast.success(t("instructorCertPage.toast.approved"));
    } catch {
      toast.error(t("instructorCertPage.toast.actionError"));
    }
  }

  async function handleReject(cert: CertificateRecord, reason?: string) {
    try {
      await rejectMutation.mutateAsync({ certificateId: cert.id, courseId: cert.courseId, reason });
      toast.success(t("instructorCertPage.toast.rejected"));
    } catch {
      toast.error(t("instructorCertPage.toast.actionError"));
    }
  }

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;
    try {
      const normalizedFile = await normalizeSignatureUpload(file);
      await signatureMutation.mutateAsync({ courseId, file: normalizedFile });
      toast.success(t("instructorCertPage.toast.signatureUploaded"));
    } catch {
      toast.error(t("instructorCertPage.toast.actionError"));
    }
    e.target.value = "";
  }

  async function handleSignatureSave(file: File) {
    if (!courseId) return;
    try {
      const normalizedFile = await normalizeSignatureUpload(file, { skipNormalization: true });
      await signatureMutation.mutateAsync({ courseId, file: normalizedFile });
      toast.success(t("instructorCertPage.toast.signatureUploaded"));
      setIsSigModalOpen(false);
    } catch {
      toast.error(t("instructorCertPage.toast.actionError"));
    }
  }

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorCertPage.title")}
        subtitle={t("instructorCertPage.subtitle")}
        showStreak={false}
      />

      {/* Course selector */}
      <div className="mb-5">
        <select
          value={courseId ?? ""}
          onChange={(e) => {
            setCourseId(e.target.value ? Number(e.target.value) : null);
            setStatusFilter("all");
          }}
          className="w-full sm:w-80 px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm font-bold focus:outline-none focus:border-primary"
        >
          <option value="">{t("instructorCertPage.selectCourse")}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {!courseId ? (
        <div className="bg-card border-2 border-border rounded-2xl p-8 text-center chunky-shadow">
          <Award className="mx-auto mb-3 size-10 text-foreground/30" strokeWidth={2} />
          <p className="font-bold text-foreground/60">{t("instructorCertPage.state.noCourse")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t("instructorCertPage.metrics.issued"), value: stats.issued },
              { label: t("instructorCertPage.metrics.pending"), value: stats.pending },
              { label: t("instructorCertPage.metrics.rejected"), value: stats.rejected },
              { label: t("instructorCertPage.metrics.revoked"), value: stats.revoked },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{metric.label}</p>
                <p className="mt-1 text-2xl font-black font-mono">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black transition-all ${
                  statusFilter === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {t(`instructorCertPage.filter.${s}`)}
              </button>
            ))}
          </div>

          {/* Certificate list */}
          <div className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow">
            {activeCertsQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : activeCertsQuery.isError ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto mb-3 size-8 text-destructive/60" />
                <p className="font-black text-destructive text-sm">
                  {t("instructorCertPage.state.error")}
                </p>
              </div>
            ) : certs.length === 0 ? (
              <div className="p-8 text-center">
                <Award className="mx-auto mb-3 size-8 text-foreground/30" />
                <p className="font-black text-sm">{t("instructorCertPage.state.empty")}</p>
              </div>
            ) : (
              <ul className="divide-y-2 divide-border">
                {certs.map((cert) => (
                  <InstructorCertRow
                    key={cert.id}
                    cert={cert}
                    onApprove={(studentFullName) => handleApprove(cert, studentFullName)}
                    onReject={(reason) => handleReject(cert, reason)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Signature upload */}
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <p className="font-black text-sm mb-1">{t("instructorCertPage.signature.header")}</p>
            <p className="text-xs font-medium text-foreground/60 mb-4">
              {t("instructorCertPage.signature.description")}
            </p>
            <input
              ref={sigInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleSignatureUpload}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsSigModalOpen(true)}
                disabled={signatureMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border bg-card font-black text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {signatureMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pen className="size-4" strokeWidth={2.5} />
                )}
                {t("adminCertPage.template.signer.drawOrUpdate")}
              </button>
              <button
                onClick={() => sigInputRef.current?.click()}
                disabled={signatureMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border bg-card font-black text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Upload className="size-4" strokeWidth={2.5} />
                {t("instructorCertPage.signature.upload")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isSigModalOpen} onOpenChange={setIsSigModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-2 border-border p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 border-b-2 border-border">
            <div>
              <DialogTitle className="font-black">{t("adminCertPage.signatureModal.title")}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs font-medium text-foreground/50">
                {t("adminCertPage.signatureModal.description")}
              </DialogDescription>
            </div>
            <button
              onClick={() => setIsSigModalOpen(false)}
              className="rounded-full border-2 border-border bg-card p-1.5 text-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </DialogHeader>
          <div className="p-5">
            <SignaturePad disabled={signatureMutation.isPending} onSave={handleSignatureSave} />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function InstructorCertRow({
  cert,
  onApprove,
  onReject,
}: {
  cert: CertificateRecord;
  onApprove: (studentFullName?: string) => void;
  onReject: (reason?: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [studentName, setStudentName] = useState(cert.studentName ?? "");
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function act(type: "approve" | "reject") {
    setPending(type);
    try {
      if (type === "approve") await onApprove(studentName.trim() || undefined);
      else await onReject(reason.trim() || undefined);
      setExpanded(false);
      setReason("");
    } finally {
      setPending(null);
    }
  }

  async function openPreview() {
    setPreviewLoading(true);
    try {
      const html = await fetchCertificatePreviewHtml(cert.courseId, {
        previewStudentName: studentName.trim() || cert.studentName || undefined,
        previewPublicId: cert.status === "issued" ? (cert.publicId || undefined) : undefined,
      });
      setPreviewHtml(html);
    } catch {
      toast.error(t("instructorCertPage.toast.previewError", { defaultValue: "Could not load preview" }));
    } finally {
      setPreviewLoading(false);
    }
  }

  const canVerify = Boolean(cert.publicId);
  const canDownload = Boolean(cert.publicId);

  return (
    <li>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
          expanded ? "bg-muted/40" : "hover:bg-muted/30"
        }`}
      >
        <CertStatusIcon status={cert.status} />
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate">
            {cert.studentName ?? cert.studentEmail ?? `Student #${cert.studentId}`}
          </p>
          <p className="text-xs font-mono text-foreground/40 truncate">{cert.publicId}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <CertStatusBadge
            status={cert.status}
            label={t(`instructorCertPage.status.${cert.status}`)}
          />
          {cert.issuedAt && (
            <span className="text-[11px] font-medium text-foreground/40">
              {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
        <ChevronDown
          className={`size-4 text-foreground/40 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t-2 border-border bg-muted/20 px-5 py-4 space-y-3">
          {cert.status === "pending_approval" && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/45 mb-1.5">
                  {t("instructorCertPage.approveForm.studentName", { defaultValue: "Student name on certificate" })}
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={cert.studentName ?? cert.studentEmail ?? ""}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/45 mb-1.5">
                  {t("instructorCertPage.rejectForm.reason")}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openPreview}
                  disabled={previewLoading || pending !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border text-xs font-bold hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  {previewLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                  {t("instructorCertPage.actions.preview", { defaultValue: "Preview" })}
                </button>
                <button
                  onClick={() => act("approve")}
                  disabled={pending !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 disabled:opacity-50"
                >
                  {pending === "approve" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {t("instructorCertPage.actions.approve")}
                </button>
                <button
                  onClick={() => act("reject")}
                  disabled={pending !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-destructive/30 text-destructive text-xs font-bold hover:bg-destructive/10 disabled:opacity-50"
                >
                  {pending === "reject" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  {t("instructorCertPage.actions.reject")}
                </button>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            {canDownload ? (
              <button
                type="button"
                onClick={() => setDownloadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border text-xs font-bold hover:bg-muted transition-colors"
              >
                <Download className="size-3.5" />
                {t("instructorCertPage.actions.download")}
              </button>
            ) : null}
            {canVerify ? (
              <Link
                to="/certificates/$publicId/verify"
                params={{ publicId: cert.publicId }}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border text-xs font-bold hover:bg-muted transition-colors"
              >
                <ExternalLink className="size-3.5" />
                {t("instructorCertPage.actions.verify")}
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <Dialog open={previewHtml !== null} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-4xl w-full rounded-3xl border-2 border-border bg-card p-0 gap-0 [&>button]:hidden overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-border">
            <p className="font-black text-sm">
              {t("instructorCertPage.previewDialog.title", { defaultValue: "Certificate preview" })}
            </p>
            <div className="flex items-center gap-2">
              {cert.status === "issued" && cert.publicId ? (
                <button
                  type="button"
                  disabled={pdfLoading}
                  onClick={() => {
                    setPdfLoading(true);
                    downloadCertificatePdf(cert.publicId!).finally(() => setPdfLoading(false));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-3 py-1.5 text-xs font-black hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  {pdfLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  {t("adminCertPage.actions.download")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setPreviewHtml(null)}
                className="size-8 grid place-items-center rounded-xl hover:bg-muted text-foreground/60 cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          {previewHtml && (
            <iframe
              srcDoc={previewHtml}
              title="Certificate preview"
              className="w-full border-0"
              style={{ height: "70vh" }}
              sandbox="allow-same-origin"
            />
          )}
        </DialogContent>
      </Dialog>

      <CertificateDownloadModal
        publicId={cert.publicId}
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />
    </li>
  );
}

function CertStatusIcon({ status }: { status: CertificateStatus }) {
  if (status === "issued")
    return <CheckCircle2 className="size-5 shrink-0 text-emerald-500" strokeWidth={2.5} />;
  if (status === "rejected" || status === "revoked")
    return <XCircle className="size-5 shrink-0 text-destructive" strokeWidth={2.5} />;
  return <Award className="size-5 shrink-0 text-amber-500" strokeWidth={2.5} />;
}

function CertStatusBadge({ status, label }: { status: CertificateStatus; label: string }) {
  const cls =
    status === "issued"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25"
      : status === "pending_approval"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25"
        : "bg-destructive/15 text-destructive ring-1 ring-destructive/25";
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

/* ─── Prototype placeholder ─────────────────────────────────────────────────── */

const PROTO_CERTS = [
  { id: 1, publicId: "QL-7821-MEM", studentName: "Alice Johnson", status: "pending_approval" as CertificateStatus },
  { id: 2, publicId: "QL-4421-LAB", studentName: "Ben Ortiz", status: "issued" as CertificateStatus },
];

function PrototypePage() {
  const { t } = useTranslation();

  return (
    <DashboardShell>
      <TopBar title={t("instructorCertPage.title")} subtitle={t("instructorCertPage.subtitle")} showStreak={false} />

      <div className="mb-5">
        <select className="w-full sm:w-80 px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm font-bold opacity-60" disabled>
          <option>Intro to Memory</option>
        </select>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black ${
                s === "all" ? "border-foreground bg-foreground text-background" : "border-border bg-card"
              }`}
            >
              {t(`instructorCertPage.filter.${s}`)}
            </button>
          ))}
        </div>

        <div className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow">
          <ul className="divide-y-2 divide-border">
            {PROTO_CERTS.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                <CertStatusIcon status={c.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{c.studentName}</p>
                  <p className="text-xs font-mono text-foreground/40">{c.publicId}</p>
                </div>
                <CertStatusBadge status={c.status} label={t(`instructorCertPage.status.${c.status}`)} />
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
          <p className="font-black text-sm mb-1">{t("instructorCertPage.signature.header")}</p>
          <p className="text-xs font-medium text-foreground/60 mb-4">
            {t("instructorCertPage.signature.description")}
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border bg-card font-black text-sm opacity-60" disabled>
            <Upload className="size-4" strokeWidth={2.5} />
            {t("instructorCertPage.signature.upload")}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
