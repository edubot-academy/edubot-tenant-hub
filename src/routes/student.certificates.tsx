import { Link, createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Award, Download, ExternalLink, Share2, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { useStudentCertificates, type StudentCertificate } from "@/lib/profile/student-profile-api";

export const Route = createFileRoute("/student/certificates")({
  head: () => ({ meta: [{ title: "QuestLMS — Certificates" }] }),
  component: CertificatesPage,
});

const certsFallback: StudentCertificate[] = [
  { id: 1, publicId: "QL-7821-MEM-2026", courseId: 101, courseTitle: "Intro to Memory", groupName: "Independent course", issuedAt: "2026-05-24T00:00:00.000Z", downloadUrl: null, status: "issued" },
  { id: 2, publicId: "QL-4421-LAB-2026", courseId: 102, courseTitle: "Lab Safety Certification", groupName: "Independent course", issuedAt: "2026-04-10T00:00:00.000Z", downloadUrl: null, status: "issued" },
  { id: 3, publicId: "QL-1109-STU-2026", courseId: 103, courseTitle: "Study Skills 101", groupName: "Independent course", issuedAt: "2026-03-02T00:00:00.000Z", downloadUrl: null, status: "issued" },
  { id: 4, publicId: "QL-0214-ESP-2026", courseId: 104, courseTitle: "Spanish A1 Foundations", groupName: "Independent course", issuedAt: "2026-02-14T00:00:00.000Z", downloadUrl: null, status: "issued" },
];

function CertificatesPage() {
  const { t } = useTranslation();
  const { context } = useAppContext();
  const backendEnabled = isBackendApiEnabled() && context.mode === "backend";
  const { data, isLoading, isError } = useStudentCertificates();
  const certs: StudentCertificate[] = backendEnabled
    ? data ?? []
    : certsFallback;
  const latestIssuedAt = certs
    .map((certificate) => certificate.issuedAt)
    .filter((value: string | null | undefined): value is string => Boolean(value))
    .sort((left: string, right: string) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
  const verifiedCount = certs.filter((certificate) => certificate.status === "issued").length;
  const courseCount = new Set(certs.map((certificate) => certificate.courseId)).size;

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  };

  const statusLabel = (status?: string) =>
    status ? t(`adminCertPage.status.${status}`, { defaultValue: status }) : "—";

  return (
    <DashboardShell>
      <TopBar title={t("studentCertificatesPage.title")} subtitle={t("studentCertificatesPage.subtitle")} showStreak={false} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: t("studentCertificatesPage.stats.earned"), value: certs.length },
          { label: t("studentCertificatesPage.stats.courses"), value: courseCount },
          { label: t("studentCertificatesPage.stats.latest"), value: latestIssuedAt ? formatDate(latestIssuedAt) : "—" },
          { label: t("studentCertificatesPage.stats.verified"), value: `${verifiedCount}/${certs.length || 0}` },
        ].map((s) => (
          <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-4 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.label}</p>
            <p className="text-2xl font-black font-mono mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {backendEnabled && isLoading && (
        <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow text-sm font-medium text-foreground/60">
          {t("studentCertificatesPage.state.loading")}
        </div>
      )}

      {backendEnabled && isError && (
        <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow text-sm font-medium text-destructive">
          {t("studentCertificatesPage.state.error")}
        </div>
      )}

      {!isLoading && !isError && certs.length === 0 && (
        <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow text-sm font-medium text-foreground/60">
          {t("studentCertificatesPage.state.empty")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {certs.map((c: StudentCertificate) => (
          <article key={String(c.id ?? c.publicId ?? c.courseId)} className="bg-card border-2 border-border rounded-3xl chunky-shadow overflow-hidden">
            <div className={`relative bg-gradient-to-br ${(c.status ?? "issued") === "issued" ? "from-primary/30 to-secondary/30" : "from-muted to-muted/60"} p-6 border-b-2 border-border`}>
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-foreground text-background text-[10px] font-black uppercase">
                <Shield className="size-3" strokeWidth={3} /> {c.status === "issued" ? t("studentCertificatesPage.card.verified") : (c.status ?? t("studentCertificatesPage.card.pending"))}
              </div>
              <Award className="size-10 text-foreground mb-3" strokeWidth={2.5} />
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/60">{t("studentCertificatesPage.card.kicker")}</p>
              <h3 className="text-xl font-black leading-tight mt-1">{c.courseTitle}</h3>
              <p className="text-xs font-bold text-foreground/70 mt-1">{c.groupName || t("studentCertificatesPage.card.noGroup")}</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("studentCertificatesPage.card.issued")}</p>
                  <p className="font-black text-sm mt-0.5">{formatDate(c.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("studentCertificatesPage.card.status")}</p>
                  <p className="font-black text-sm mt-0.5">{statusLabel(c.status)}</p>
                </div>
              </div>
              <div className="text-[10px] font-mono font-bold text-foreground/50 bg-muted rounded-lg px-3 py-2 truncate">
                ID: {c.publicId ?? c.id ?? c.courseId}
              </div>
              <div className="flex gap-2">
                {c.publicId ? (
                  <Link
                    to="/certificates/$publicId/download"
                    params={{ publicId: c.publicId }}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform"
                  >
                    <Download className="size-4" strokeWidth={2.5} /> {t("studentCertificatesPage.actions.pdf")}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow opacity-50"
                  >
                    <Download className="size-4" strokeWidth={2.5} /> {t("studentCertificatesPage.actions.pdf")}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!c.verificationUrl) return toast.error(t("studentCertificatesPage.toast.shareUnavailable"));
                    navigator.clipboard?.writeText(c.verificationUrl);
                    toast.success(t("studentCertificatesPage.toast.shareCopied"));
                  }}
                  disabled={!c.verificationUrl}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-card font-black text-sm border-2 border-border hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:translate-y-0"
                >
                  <Share2 className="size-4" strokeWidth={2.5} /> {t("studentCertificatesPage.actions.share")}
                </button>
                {c.publicId ? (
                  <Link
                    to="/certificates/$publicId/verify"
                    params={{ publicId: c.publicId }}
                    className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border hover:-translate-y-0.5 transition-transform"
                    title={t("studentCertificatesPage.actions.verify")}
                  >
                    <ExternalLink className="size-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="size-10 grid place-items-center rounded-xl bg-card border-2 border-border opacity-50"
                    title={t("studentCertificatesPage.actions.verify")}
                  >
                    <ExternalLink className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
