import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, RefreshCw, Shield } from "lucide-react";

import { downloadCertificatePdf } from "@/lib/certificates-api";

export const Route = createFileRoute("/certificates/$publicId/download")({
  component: CertificateDownloadPage,
});

function CertificateDownloadPage() {
  const { t } = useTranslation();
  const { publicId } = Route.useParams();
  const [status, setStatus] = useState<"preparing" | "ready" | "failed">("preparing");
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  async function runDownload() {
    setStatus("preparing");
    setError("");
    try {
      await downloadCertificatePdf(publicId);
      setStatus("ready");
    } catch {
      setStatus("failed");
      setError(t("certificatePublicPage.download.error"));
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runDownload();
  }, [publicId]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-amber-500 px-8 py-8 text-white">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
            <Shield className="size-4" />
            {t("certificatePublicPage.download.eyebrow")}
          </div>
          <h1 className="mt-4 text-3xl font-black">{t("certificatePublicPage.download.title")}</h1>
          <p className="mt-3 text-sm leading-6 text-white/80">{t("certificatePublicPage.download.description")}</p>
        </div>

        <div className="p-8">
          <div className="rounded-3xl border border-border bg-muted/30 p-6">
            <div className="flex items-start gap-4">
              <div className={`rounded-2xl p-3 ${status === "failed" ? "bg-destructive/10 text-destructive" : status === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {status === "failed" ? <AlertTriangle className="size-6" /> : status === "ready" ? <CheckCircle2 className="size-6" /> : <Download className="size-6" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground/50">
                  {t(`certificatePublicPage.download.status.${status}`)}
                </p>
                <p className="mt-2 text-lg font-black">
                  {t(`certificatePublicPage.download.message.${status}`)}
                </p>
                <p className="mt-2 text-sm text-foreground/60">
                  {status === "failed" ? error : t("certificatePublicPage.download.helper", { publicId })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void runDownload()}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background"
            >
              {status === "preparing" ? <RefreshCw className="size-4 animate-spin" /> : <Download className="size-4" />}
              {t("certificatePublicPage.download.retry")}
            </button>
            <Link
              to="/certificates/$publicId/verify"
              params={{ publicId }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-bold hover:bg-muted"
            >
              <Shield className="size-4" />
              {t("certificatePublicPage.download.openVerification")}
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-bold hover:bg-muted">
              <ArrowLeft className="size-4" />
              {t("certificatePublicPage.common.home")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
