import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Award, CheckCircle2, Clock3, Copy, ExternalLink, Shield, XCircle } from "lucide-react";

import { fetchCertificateVerification, type CertificateVerificationRecord } from "@/lib/certificates-api";

export const Route = createFileRoute("/certificates/$publicId/verify")({
  component: CertificateVerificationPage,
});

function CertificateVerificationPage() {
  const { t, i18n } = useTranslation();
  const { publicId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CertificateVerificationRecord | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const result = await fetchCertificateVerification(publicId);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError(t("certificatePublicPage.verify.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [publicId, t]);

  const status = data?.status ?? "rejected";
  const meta = useMemo(() => {
    if (status === "issued") return { icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-100 border-emerald-200" };
    if (status === "pending_approval") return { icon: Clock3, tone: "text-amber-700 bg-amber-100 border-amber-200" };
    if (status === "revoked") return { icon: XCircle, tone: "text-slate-700 bg-slate-200 border-slate-300" };
    return { icon: XCircle, tone: "text-red-700 bg-red-100 border-red-200" };
  }, [status]);
  const StatusIcon = meta.icon;

  const formatDate = (value?: string | null) => {
    if (!value) return t("certificatePublicPage.common.notSpecified");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("certificatePublicPage.common.notSpecified");
    return date.toLocaleDateString(i18n.language || undefined, { day: "2-digit", month: "long", year: "numeric" });
  };

  const valueOrFallback = (value?: string | null, fallback?: string) =>
    String(value ?? "").trim() || fallback || t("certificatePublicPage.common.notSpecified");

  async function handleCopy() {
    if (!data?.verificationUrl || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(data.verificationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-amber-500 px-8 py-8 text-white">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
            <Shield className="size-4" />
            {t("certificatePublicPage.verify.eyebrow")}
          </div>
          <h1 className="mt-4 text-3xl font-black">{t("certificatePublicPage.verify.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            {t("certificatePublicPage.verify.description")}
          </p>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="rounded-3xl border border-border bg-muted/40 p-8 text-center text-sm text-foreground/60">
              {t("certificatePublicPage.verify.loading")}
            </div>
          ) : error ? (
            <div className="space-y-5">
              <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
                <AlertTriangle className="mx-auto size-8" />
                <p className="mt-4 text-lg font-black">{error}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/" className="inline-flex items-center rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background">
                  {t("certificatePublicPage.common.home")}
                </Link>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground/50">
                    {t("certificatePublicPage.verify.certificateId")}
                  </p>
                  <p className="mt-2 break-all text-lg font-bold">{valueOrFallback(data.publicId, publicId)}</p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${meta.tone}`}>
                  <StatusIcon className="size-4" />
                  {t(`adminCertPage.status.${status}`)}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-muted/30 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-card p-3 text-primary shadow-sm">
                    <Award className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-foreground/50">
                      {valueOrFallback(data.primaryBrandName, "EduBot")}
                    </p>
                    <h2 className="mt-1 break-words text-2xl font-black">
                      {valueOrFallback(data.certificateTitle, t("certificatePublicPage.verify.fallbackTitle"))}
                    </h2>
                    {data.secondaryBrandName ? (
                      <p className="mt-3 text-sm text-foreground/70">
                        {t("certificatePublicPage.verify.partner")}: <span className="font-bold text-foreground">{data.secondaryBrandName}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard label={t("certificatePublicPage.verify.student")} value={valueOrFallback(data.studentFullName)} />
                <DetailCard label={t("certificatePublicPage.verify.course")} value={valueOrFallback(data.courseTitle)} />
                <DetailCard label={t("certificatePublicPage.verify.issuedAt")} value={formatDate(data.issuedAt)} />
                <DetailCard label={t("certificatePublicPage.verify.signer")} value={valueOrFallback(data.issuerDisplayName)} helper={valueOrFallback(data.issuerTitle)} />
              </div>

              <div className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground/50">
                  {t("certificatePublicPage.verify.verificationLink")}
                </p>
                <p className="mt-2 break-all text-sm font-medium text-foreground/70">
                  {valueOrFallback(data.verificationUrl)}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-muted"
                  >
                    <Copy className="size-4" />
                    {copied ? t("certificatePublicPage.verify.copied") : t("certificatePublicPage.verify.copy")}
                  </button>
                  {data.verificationUrl ? (
                    <a
                      href={data.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-muted"
                    >
                      <ExternalLink className="size-4" />
                      {t("certificatePublicPage.verify.open")}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function DetailCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-3xl border border-border p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground/50">{label}</p>
      <p className="mt-2 break-words text-lg font-bold">{value}</p>
      {helper ? <p className="mt-1 text-sm text-foreground/60">{helper}</p> : null}
    </div>
  );
}
