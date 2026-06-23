import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Download, Loader2, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { downloadCertificatePdf } from "@/lib/certificates-api";

export function CertificateDownloadModal({
  publicId,
  open,
  onClose,
}: {
  publicId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"preparing" | "ready" | "failed">("preparing");
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open || !publicId) return;
    startedRef.current = false;
    setStatus("preparing");
  }, [open, publicId]);

  useEffect(() => {
    if (!open || !publicId || startedRef.current) return;
    startedRef.current = true;
    downloadCertificatePdf(publicId)
      .then(() => setStatus("ready"))
      .catch(() => setStatus("failed"));
  }, [open, publicId]);

  function retry() {
    if (!publicId) return;
    setStatus("preparing");
    startedRef.current = true;
    downloadCertificatePdf(publicId)
      .then(() => setStatus("ready"))
      .catch(() => setStatus("failed"));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl border-2 border-border p-0 gap-0 [&>button]:hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border">
          <p className="font-black text-sm">
            {t("certificatePublicPage.download.title")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-xl hover:bg-muted text-foreground/60 cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-4 rounded-2xl border-2 border-border bg-muted/30 p-4">
            <div
              className={`rounded-xl p-2.5 shrink-0 ${
                status === "failed"
                  ? "bg-destructive/10 text-destructive"
                  : status === "ready"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {status === "preparing" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : status === "ready" ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm">
                {t(`certificatePublicPage.download.status.${status}`)}
              </p>
              <p className="mt-1 text-xs font-medium text-foreground/60 font-mono truncate">
                {publicId}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {status !== "preparing" && (
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border bg-card text-sm font-black hover:bg-muted transition-colors"
              >
                <Download className="size-4" />
                {t("certificatePublicPage.download.retry")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border bg-card text-sm font-black hover:bg-muted transition-colors"
            >
              {t("common.close", { defaultValue: "Close" })}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
